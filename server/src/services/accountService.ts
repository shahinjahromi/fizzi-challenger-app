import prisma from '../db.js';
import { createError } from '../types/index.js';

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
