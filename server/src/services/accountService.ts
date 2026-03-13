import prisma from '../db.js';
import { createError } from '../types/index.js';
import { isNymbusWorkspace, NYMBUS_ACCOUNT_MAP } from '../utils/nymbusMapping.js';
import * as nymbus from './nymbusService.js';
import logger from '../utils/logger.js';

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

export async function getAccountDetails(userId: string, accountId: string) {
  const account = await assertAccountAccess(userId, accountId);

  // ── Nymbus source-of-truth: fetch live balance / status ─────────────
  if (isNymbusWorkspace(account.workspaceId)) {
    const nymbusId = NYMBUS_ACCOUNT_MAP[account.accountNumber];
    if (nymbusId) {
      try {
        const raw = await nymbus.listAccounts({ accountIds: nymbusId });
        const list: nymbus.NymbusAccount[] = Array.isArray(raw)
          ? raw
          : (raw as { data: nymbus.NymbusAccount[] }).data ?? [];
        const live = list.find((a) => a.id === nymbusId);

        if (live) {
          return {
            id: account.id,
            name: account.name,
            last4: account.accountNumber.slice(-4),
            routingLast4: account.routingNumber.slice(-4),
            type: (live.type as string) ?? account.type,
            availableBalance: Number(
              live.availableBalance ??
              (live as Record<string, unknown>)['available_balance'] ??
              0,
            ),
            currentBalance: Number(
              live.currentBalance ??
              (live as Record<string, unknown>)['current_balance'] ??
              live.availableBalance ??
              (live as Record<string, unknown>)['available_balance'] ??
              0,
            ),
            interestRate: Number(account.interestRate),
            interestEarned: Number(account.interestEarned),
            isMoveMoneyEligible: account.isMoveMoneyEligible,
            status: (live.status as string) ?? account.status,
            isClosed: account.isClosed,
            workspaceId: account.workspaceId,
            createdAt: account.createdAt,
          };
        }
      } catch (err) {
        logger.warn('Nymbus account detail fetch failed – falling back to local data', {
          accountId,
          error: err instanceof Error ? err.message : err,
        });
      }
    }
  }

  // Fallback: local-only data
  return {
    id: account.id,
    name: account.name,
    last4: account.accountNumber.slice(-4),
    routingLast4: account.routingNumber.slice(-4),
    type: account.type,
    availableBalance: Number(account.availableBalance),
    currentBalance: Number(account.currentBalance),
    interestRate: Number(account.interestRate),
    interestEarned: Number(account.interestEarned),
    isMoveMoneyEligible: account.isMoveMoneyEligible,
    status: account.status,
    isClosed: account.isClosed,
    workspaceId: account.workspaceId,
    createdAt: account.createdAt,
  };
}
