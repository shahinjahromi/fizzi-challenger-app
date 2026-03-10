import { Prisma } from '@prisma/client';
import prisma from '../db.js';
import { createError } from '../types/index.js';

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

export async function listTransactions(userId: string, accountId: string, query: TransactionQuery) {
  await assertAccountAccess(userId, accountId);

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
