import { Prisma } from '@prisma/client';
import prisma from '../db.js';
import { createError } from '../types/index.js';
import { isNymbusWorkspace, NYMBUS_ACCOUNT_MAP } from '../utils/nymbusMapping.js';
import * as nymbus from './nymbusService.js';
import logger from '../utils/logger.js';

export interface TransactionQuery {
  status?: string;
  cursor?: string;
  limit?: number;
  search?: string;
}

async function assertAccountAccess(userId: string, accountId: string) {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { workspace: { include: { memberships: true } } },
  });
  if (!account) throw createError('Account not found.', 404, 'NOT_FOUND');
  const isMember = account.workspace.memberships.some((m) => m.userId === userId);
  if (!isMember) throw createError('Access denied.', 403, 'FORBIDDEN');
  return account;
}

// ── Nymbus transaction normalizer ─────────────────────────────────────────
interface NymbusRawTransaction {
  id?: string;
  amount?: number;
  type?: string;
  direction?: string;
  description?: string;
  memo?: string;
  status?: string;
  counterpart?: string;
  reference_id?: string;
  referenceId?: string;
  posted_at?: string;
  postedAt?: string;
  created_at?: string;
  createdAt?: string;
  account_id?: string;
  accountId?: string;
  transfer_id?: string;
  transferId?: string;
  [key: string]: unknown;
}

function normalizeNymbusTransaction(tx: NymbusRawTransaction, localAccountId: string) {
  // Determine direction from type/direction field (handle various formats)
  const rawDir = (tx.direction ?? tx.type ?? '').toString().toLowerCase();
  const direction = rawDir.includes('credit') ? 'Credit' : rawDir.includes('debit') ? 'Debit' : 'Debit';

  return {
    id: tx.id ?? '',
    accountId: localAccountId,
    amount: Number(tx.amount ?? 0),
    currency: 'USD',
    direction,
    status: (tx.status ?? 'Posted').toString(),
    description: tx.description ?? tx.memo ?? '',
    counterpart: tx.counterpart ?? null,
    referenceId: tx.referenceId ?? tx.reference_id ?? null,
    transferId: tx.transferId ?? tx.transfer_id ?? null,
    postedAt: tx.postedAt ?? tx.posted_at ?? tx.createdAt ?? tx.created_at ?? null,
    createdAt: tx.createdAt ?? tx.created_at ?? null,
  };
}

export async function listTransactions(userId: string, accountId: string, query: TransactionQuery) {
  const account = await assertAccountAccess(userId, accountId);

  // ── Nymbus source-of-truth: fetch transactions from Nymbus ──────────
  if (isNymbusWorkspace(account.workspaceId)) {
    const nymbusId = NYMBUS_ACCOUNT_MAP[account.accountNumber];
    if (nymbusId) {
      try {
        const limit = Math.min(query.limit ?? 20, 100);
        const raw = await nymbus.listTransactions(nymbusId, limit);

        // Nymbus may return { data: [...] } or a plain array
        let txList: NymbusRawTransaction[] = [];
        if (Array.isArray(raw)) {
          txList = raw;
        } else if (raw && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)) {
          txList = (raw as { data: NymbusRawTransaction[] }).data ?? [];
        }

        // Apply client-side search filter if requested
        if (query.search) {
          const term = query.search.toLowerCase();
          txList = txList.filter(
            (t) =>
              (t.description ?? '').toLowerCase().includes(term) ||
              (t.memo ?? '').toLowerCase().includes(term),
          );
        }

        // Apply status filter if requested
        if (query.status) {
          const s = query.status.toLowerCase();
          txList = txList.filter(
            (t) => (t.status ?? '').toString().toLowerCase() === s,
          );
        }

        const data = txList.map((t) => normalizeNymbusTransaction(t, accountId));

        return {
          data,
          nextCursor: null, // Nymbus sandbox doesn't use keyset cursors
          total: data.length,
        };
      } catch (err) {
        logger.warn('Nymbus transaction fetch failed – falling back to local data', {
          accountId,
          error: err instanceof Error ? err.message : err,
        });
        // Fall through to local DB below
      }
    }
  }

  // ── Local DB path (non-Nymbus or Nymbus fallback) ──────────────────────

  const limit = Math.min(query.limit ?? 20, 100);

  const where: Prisma.TransactionWhereInput = { accountId };

  if (query.status) {
    where.status = query.status as Prisma.EnumTransactionStatusFilter;
  }

  if (query.search) {
    where.description = { contains: query.search, mode: 'insensitive' };
  }

  // Keyset/cursor pagination: find the anchor transaction and page from there
  if (query.cursor) {
    const cursorTx = await prisma.transaction.findUnique({ where: { id: query.cursor } });
    if (cursorTx) {
      const anchorPostedAt = cursorTx.postedAt ?? cursorTx.createdAt;
      // Records strictly before the anchor row in (postedAt DESC, createdAt DESC, id ASC) order
      where.AND = [
        {
          OR: [
            { postedAt: { lt: anchorPostedAt } },
            {
              AND: [
                { postedAt: anchorPostedAt },
                {
                  OR: [
                    { createdAt: { lt: cursorTx.createdAt } },
                    { AND: [{ createdAt: cursorTx.createdAt }, { id: { gt: cursorTx.id } }] },
                  ],
                },
              ],
            },
          ],
        },
      ];
    }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: [{ postedAt: 'desc' }, { createdAt: 'desc' }],
    take: limit + 1,
  });

  const hasMore = transactions.length > limit;
  const data = hasMore ? transactions.slice(0, limit) : transactions;
  const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null;

  const total = await prisma.transaction.count({ where: { accountId } });

  return {
    data: data.map((t) => ({
      id: t.id,
      accountId: t.accountId,
      amount: Number(t.amount),
      currency: t.currency,
      direction: t.direction,
      status: t.status,
      description: t.description,
      counterpart: t.counterpart,
      referenceId: t.referenceId,
      transferId: t.transferId,
      postedAt: t.postedAt,
      createdAt: t.createdAt,
    })),
    nextCursor,
    total,
  };
}
