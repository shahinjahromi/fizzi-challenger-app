import prisma from '../db.js';
import { createError } from '../types/index.js';

export async function listWorkspacesForUser(userId: string) {
  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId },
    include: { workspace: true },
  });

  return memberships.map((m) => ({
    id: m.workspaceId,
    name: m.workspace.name,
    role: m.role,
    createdAt: m.workspace.createdAt,
  }));
}

export async function listAccountsForWorkspace(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) {
    throw createError('Workspace not found or access denied.', 403, 'FORBIDDEN');
  }

  const accounts = await prisma.account.findMany({
    where: { workspaceId, isClosed: false },
    orderBy: { createdAt: 'asc' },
  });

  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    last4: a.accountNumber.slice(-4),
    routingLast4: a.routingNumber.slice(-4),
    type: a.type,
    availableBalance: Number(a.availableBalance),
    currentBalance: Number(a.currentBalance),
    interestRate: Number(a.interestRate),
    interestEarned: Number(a.interestEarned),
    isMoveMoneyEligible: a.isMoveMoneyEligible,
    status: a.status,
    isClosed: a.isClosed,
  }));
}
