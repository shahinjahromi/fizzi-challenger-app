import { v4 as uuidv4 } from 'uuid';
import { Prisma, TransactionDirection, TransactionStatus, TransferStatus } from '@prisma/client';
import prisma from '../db.js';
import { createError } from '../types/index.js';
import { getEffectiveDate, isBefore1PMET, isBusinessDay } from '../utils/dateUtils.js';
import { createAuditEvent } from './auditService.js';
import { AuditEventType } from '@prisma/client';
import { decideLimits } from './limitService.js';
import * as nymbus from './nymbusService.js';
import logger from '../utils/logger.js';
import { isNymbusWorkspace, NYMBUS_ACCOUNT_MAP } from '../utils/nymbusMapping.js';
import { resolveNymbusPair } from '../utils/nymbusMapping.js';

export interface InternalTransferInput {
  userId: string;
  workspaceId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  memo?: string;
  idempotencyKey: string;
  requestedExecutionDate?: Date;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

export async function createInternalTransfer(input: InternalTransferInput) {
  // Idempotency check
  const existingKey = await prisma.idempotencyKey.findUnique({
    where: { key: `internal:${input.idempotencyKey}` },
  });
  if (existingKey) {
    return existingKey.responseBody;
  }

  // Validate workspace membership
  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId: input.userId, workspaceId: input.workspaceId } },
  });
  if (!membership) throw createError('Workspace access denied.', 403, 'FORBIDDEN');

  // Validate accounts belong to workspace
  const [fromAccount, toAccount] = await Promise.all([
    prisma.account.findUnique({ where: { id: input.fromAccountId } }),
    prisma.account.findUnique({ where: { id: input.toAccountId } }),
  ]);

  if (!fromAccount || fromAccount.workspaceId !== input.workspaceId) {
    throw createError('Source account not found or not in this workspace.', 404, 'NOT_FOUND');
  }
  if (!toAccount || toAccount.workspaceId !== input.workspaceId) {
    throw createError('Destination account not found or not in this workspace.', 404, 'NOT_FOUND');
  }
  if (input.fromAccountId === input.toAccountId) {
    throw createError('Source and destination accounts must be different.', 400, 'SAME_ACCOUNT');
  }
  if (!fromAccount.isMoveMoneyEligible || fromAccount.isClosed) {
    throw createError('Source account is not eligible for transfers.', 400, 'ACCOUNT_NOT_ELIGIBLE');
  }
  if (!toAccount.isMoveMoneyEligible || toAccount.isClosed) {
    throw createError('Destination account is not eligible for transfers.', 400, 'ACCOUNT_NOT_ELIGIBLE');
  }
  if (Number(fromAccount.availableBalance) < input.amount) {
    // For Nymbus accounts, check Nymbus balance as the source-of-truth
    if (isNymbusWorkspace(input.workspaceId)) {
      const nymbusFromId = NYMBUS_ACCOUNT_MAP[fromAccount.accountNumber];
      if (nymbusFromId) {
        try {
          const raw = await nymbus.listAccounts({ accountIds: nymbusFromId });
          const list: nymbus.NymbusAccount[] = Array.isArray(raw)
            ? raw
            : (raw as { data: nymbus.NymbusAccount[] }).data ?? [];
          const live = list.find((a) => a.id === nymbusFromId);
          const liveBalance = Number(
            live?.availableBalance ??
            (live as Record<string, unknown> | undefined)?.['available_balance'] ??
            0,
          );
          if (liveBalance < input.amount) {
            throw createError('Insufficient funds.', 400, 'INSUFFICIENT_FUNDS');
          }
          // Nymbus has sufficient funds — continue
        } catch (err) {
          if ((err as { code?: string }).code === 'INSUFFICIENT_FUNDS') throw err;
          logger.warn('Nymbus balance check failed – using local fallback', {
            error: err instanceof Error ? err.message : err,
          });
          throw createError('Insufficient funds.', 400, 'INSUFFICIENT_FUNDS');
        }
      } else {
        throw createError('Insufficient funds.', 400, 'INSUFFICIENT_FUNDS');
      }
    } else {
      throw createError('Insufficient funds.', 400, 'INSUFFICIENT_FUNDS');
    }
  }

  // Limits decision
  const decision = await decideLimits({
    userId: input.userId,
    accountId: input.fromAccountId,
    amount: input.amount,
    transferType: 'Internal',
  });

  if (decision.outcome === 'Blocked') {
    throw createError(
      `Transfer blocked: ${decision.blockReason ?? 'Exceeds limits.'}`,
      400,
      'LIMIT_BLOCKED'
    );
  }

  // Cutoff / effective date
  const now = new Date();
  const cutoffApplied = !(isBusinessDay(now) && isBefore1PMET(now));
  const effectiveDate = getEffectiveDate(input.requestedExecutionDate, now);

  const referenceId = uuidv4();
  const transferId = uuidv4();
  const isNymbus = isNymbusWorkspace(input.workspaceId);

  // ── Nymbus primary: call Nymbus API FIRST so it is the ledger of record ──
  let nymbusRef: unknown = null;
  if (isNymbus) {
    const nymbusAccounts = await resolveNymbusPair(input.fromAccountId, input.toAccountId);
    const nymbusResult = await nymbus.createInternalTransfer({
      fromAccountId: nymbusAccounts.fromNymbusId,
      toAccountId: nymbusAccounts.toNymbusId,
      amount: input.amount,
      description: input.memo ?? 'Internal Transfer via Fizzi',
      idempotencyKey: input.idempotencyKey,
    });
    nymbusRef = nymbusResult;
    logger.info('Nymbus internal transfer submitted (primary)', {
      transferId,
      nymbusResult,
    });
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const transfer = await tx.internalTransfer.create({
      data: {
        id: transferId,
        workspaceId: input.workspaceId,
        fromAccountId: input.fromAccountId,
        toAccountId: input.toAccountId,
        amount: input.amount,
        memo: input.memo,
        status: TransferStatus.Settled,
        referenceId,
        effectiveDate,
        cutoffApplied,
        idempotencyKey: input.idempotencyKey,
        limitDecisionId: decision.id,
        requestedExecutionDate: input.requestedExecutionDate,
      },
    });

    // Debit from source
    await tx.transaction.create({
      data: {
        accountId: input.fromAccountId,
        amount: input.amount,
        currency: 'USD',
        direction: TransactionDirection.Debit,
        status: TransactionStatus.Posted,
        description: input.memo ?? 'Internal Transfer',
        counterpart: toAccount.name,
        referenceId,
        transferId,
        postedAt: effectiveDate,
      },
    });

    // Credit to destination
    await tx.transaction.create({
      data: {
        accountId: input.toAccountId,
        amount: input.amount,
        currency: 'USD',
        direction: TransactionDirection.Credit,
        status: TransactionStatus.Posted,
        description: input.memo ?? 'Internal Transfer',
        counterpart: fromAccount.name,
        referenceId,
        transferId,
        postedAt: effectiveDate,
      },
    });

    // Only update local balances for non-Nymbus workspaces.
    // Nymbus manages its own ledger — our local copy would go stale.
    if (!isNymbus) {
      await tx.account.update({
        where: { id: input.fromAccountId },
        data: {
          availableBalance: { decrement: input.amount },
          currentBalance: { decrement: input.amount },
        },
      });
      await tx.account.update({
        where: { id: input.toAccountId },
        data: {
          availableBalance: { increment: input.amount },
          currentBalance: { increment: input.amount },
        },
      });
    }

    return transfer;
  });

  const responseBody = {
    transferId: result.id,
    status: result.status,
    referenceId: result.referenceId,
    effectiveDate: result.effectiveDate,
    cutoffApplied: result.cutoffApplied,
    createdAt: result.createdAt,
    ...(nymbusRef ? { nymbusRef } : {}),
  };

  await prisma.idempotencyKey.create({
    data: {
      key: `internal:${input.idempotencyKey}`,
      responseBody: responseBody as unknown as Prisma.InputJsonValue,
      statusCode: 201,
    },
  });

  await createAuditEvent({
    userId: input.userId,
    eventType: AuditEventType.TRANSFER_SUBMITTED,
    metadata: { transferId: result.id, amount: input.amount, referenceId },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    correlationId: input.correlationId,
  });

  return responseBody;
}

export async function listTransfers(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) throw createError('Workspace access denied.', 403, 'FORBIDDEN');

  const transfers = await prisma.internalTransfer.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return transfers.map((t) => ({
    id: t.id,
    fromAccountId: t.fromAccountId,
    toAccountId: t.toAccountId,
    amount: Number(t.amount),
    memo: t.memo,
    status: t.status,
    referenceId: t.referenceId,
    effectiveDate: t.effectiveDate,
    cutoffApplied: t.cutoffApplied,
    createdAt: t.createdAt,
  }));
}
