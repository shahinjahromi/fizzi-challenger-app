/**
 * Centralised Nymbus workspace detection and account-ID mapping.
 *
 * Every service that needs to decide "is this a Nymbus-managed account?"
 * should import helpers from here rather than duplicating constants.
 */

import prisma from '../db.js';

// ─── Constants ────────────────────────────────────────────────────────────────
export const NYMBUS_WORKSPACE_ID = '33333333-3333-4333-8333-333333333333';

/**
 * Maps local Fizzi account numbers → Nymbus sandbox account IDs.
 * When Nymbus On-boarding API is used in production the mapping would
 * live in the database; for the sandbox we hard-code it.
 */
export const NYMBUS_ACCOUNT_MAP: Record<string, string> = {
  '3000000001': 'acct_sand_001', // Nymbus Checking
  '3000000002': 'acct_sand_002', // Nymbus Savings
};

/** Reverse lookup: Nymbus account ID → local account number */
export const NYMBUS_ACCOUNT_MAP_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(NYMBUS_ACCOUNT_MAP).map(([k, v]) => [v, k]),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Check whether a workspace is managed by Nymbus */
export function isNymbusWorkspace(workspaceId: string): boolean {
  return workspaceId === NYMBUS_WORKSPACE_ID;
}

/** Resolve a local account number to its Nymbus sandbox account ID (or null) */
export function resolveNymbusId(localAccountNumber: string): string | null {
  return NYMBUS_ACCOUNT_MAP[localAccountNumber] ?? null;
}

/**
 * Given a local account UUID, look up the account's number in the DB
 * and return the corresponding Nymbus account ID.
 */
export async function resolveNymbusIdForAccount(localAccountId: string): Promise<string | null> {
  const acct = await prisma.account.findUnique({
    where: { id: localAccountId },
    select: { accountNumber: true, workspaceId: true },
  });
  if (!acct || acct.workspaceId !== NYMBUS_WORKSPACE_ID) return null;
  return NYMBUS_ACCOUNT_MAP[acct.accountNumber] ?? null;
}

/**
 * Resolve Nymbus account IDs for a pair of local account UUIDs
 * (convenience wrapper used by transfers).
 */
export async function resolveNymbusPair(
  fromLocalId: string,
  toLocalId: string,
): Promise<{ fromNymbusId: string; toNymbusId: string }> {
  const [fromAccount, toAccount] = await Promise.all([
    prisma.account.findUnique({ where: { id: fromLocalId }, select: { accountNumber: true } }),
    prisma.account.findUnique({ where: { id: toLocalId }, select: { accountNumber: true } }),
  ]);

  if (!fromAccount || !toAccount) {
    throw new Error('Unable to resolve Nymbus account IDs: local account not found');
  }

  const fromNymbusId = NYMBUS_ACCOUNT_MAP[fromAccount.accountNumber];
  const toNymbusId = NYMBUS_ACCOUNT_MAP[toAccount.accountNumber];

  if (!fromNymbusId || !toNymbusId) {
    throw new Error(
      `No Nymbus mapping for account(s): ${fromAccount.accountNumber}, ${toAccount.accountNumber}`,
    );
  }

  return { fromNymbusId, toNymbusId };
}
