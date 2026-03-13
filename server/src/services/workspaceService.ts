import prisma from '../db.js';
import { createError } from '../types/index.js';
import { isNymbusWorkspace, NYMBUS_ACCOUNT_MAP } from '../utils/nymbusMapping.js';
import * as nymbus from './nymbusService.js';
import logger from '../utils/logger.js';

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

  // Fetch local account records (always needed for Fizzi-side IDs and metadata)
  const accounts = await prisma.account.findMany({
    where: { workspaceId, isClosed: false },
    orderBy: { createdAt: 'asc' },
  });

  // ── Nymbus source-of-truth: overlay live balances / status ────────────
  if (isNymbusWorkspace(workspaceId)) {
    try {
      // Collect the Nymbus IDs that correspond to local accounts
      const nymbusIds = accounts
        .map((a) => NYMBUS_ACCOUNT_MAP[a.accountNumber])
        .filter(Boolean);

      if (nymbusIds.length > 0) {
        const raw = await nymbus.listAccounts({ accountIds: nymbusIds.join(',') });
        const nymbusAccounts: nymbus.NymbusAccount[] = Array.isArray(raw)
          ? raw
          : (raw as { data: nymbus.NymbusAccount[] }).data ?? [];

        // Build a lookup by Nymbus ID (handles both camelCase and snake_case)
        const byNymbusId = new Map<string, nymbus.NymbusAccount>();
        for (const na of nymbusAccounts) {
          byNymbusId.set(na.id, na);
        }

        return accounts.map((a) => {
          const nymbusId = NYMBUS_ACCOUNT_MAP[a.accountNumber];
          const live = nymbusId ? byNymbusId.get(nymbusId) : undefined;
          return {
            id: a.id,
            name: a.name,
            last4: a.accountNumber.slice(-4),
            routingLast4: a.routingNumber.slice(-4),
            type: (live?.type as string) ?? a.type,
            availableBalance: live
              ? Number(live.availableBalance ?? (live as Record<string, unknown>)['available_balance'] ?? 0)
              : Number(a.availableBalance),
            currentBalance: live
              ? Number(live.currentBalance ?? (live as Record<string, unknown>)['current_balance'] ?? live.availableBalance ?? (live as Record<string, unknown>)['available_balance'] ?? 0)
              : Number(a.currentBalance),
            interestRate: Number(a.interestRate),
            interestEarned: Number(a.interestEarned),
            isMoveMoneyEligible: a.isMoveMoneyEligible,
            status: (live?.status as string) ?? a.status,
            isClosed: a.isClosed,
          };
        });
      }
    } catch (err) {
      // If Nymbus is unreachable, fall back to local data with a warning
      logger.warn('Nymbus account fetch failed – falling back to local data', {
        error: err instanceof Error ? err.message : err,
      });
    }
  }

  // Non-Nymbus workspace (or Nymbus fallback)
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
