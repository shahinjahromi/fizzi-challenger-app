import { v4 as uuidv4 } from 'uuid';
import { Prisma, TransferStatus, AuditEventType } from '@prisma/client';
import prisma from '../db.js';
import { createError } from '../types/index.js';
import { getEffectiveDate } from '../utils/dateUtils.js';
import { createAuditEvent } from './auditService.js';
import { decideLimits } from './limitService.js';
import logger from '../utils/logger.js';

export interface AchTransferInput {
  userId: string;
  workspaceId: string;
  direction: 'Credit' | 'Debit';
  fromAccountId: string;
  toExternalAccountId: string;
  amount: number;
  isSameDay?: boolean;
  isConsumerDebit?: boolean;
  consentId?: string;
  idempotencyKey: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

export interface LinkExternalAccountInput {
  userId: string;
  workspaceId: string;
  displayName: string;
  maskedAccount: string;
  routingLast4: string;
}

export interface CaptureConsentInput {
  userId: string;
  externalAccountId: string;
  consentIp: string;
  disclosuresVersion: string;
  artifacts?: Record<string, unknown>;
}

export async function createAchTransfer(input: AchTransferInput) {
  const idempotencyKeyFull = `ach:${input.idempotencyKey}`;

  const existingKey = await prisma.idempotencyKey.findUnique({ where: { key: idempotencyKeyFull } });
  if (existingKey) return existingKey.responseBody;

  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId: input.userId, workspaceId: input.workspaceId } },
  });
  if (!membership) throw createError('Workspace access denied.', 403, 'FORBIDDEN');

  const fromAccount = await prisma.account.findUnique({ where: { id: input.fromAccountId } });
  if (!fromAccount || fromAccount.workspaceId !== input.workspaceId) {
    throw createError('Source account not found or not in this workspace.', 404, 'NOT_FOUND');
  }

  const externalAccount = await prisma.externalAccount.findUnique({
    where: { id: input.toExternalAccountId },
  });
  if (!externalAccount || externalAccount.workspaceId !== input.workspaceId) {
    throw createError('External account not found.', 404, 'NOT_FOUND');
  }
  if (externalAccount.status !== 'Linked') {
    throw createError('External account is not active.', 400, 'EXTERNAL_ACCOUNT_INACTIVE');
  }

  if (input.isConsumerDebit && !input.consentId) {
    const consent = await prisma.achConsent.findFirst({
      where: { userId: input.userId, externalAccountId: input.toExternalAccountId },
    });
    if (!consent) {
      throw createError('Consumer debit consent is required.', 400, 'CONSENT_REQUIRED');
    }
  }

  const decision = await decideLimits({
    userId: input.userId,
    accountId: input.fromAccountId,
    amount: input.amount,
    transferType: 'ACH',
  });

  if (decision.outcome === 'Blocked') {
    throw createError(
      `ACH transfer blocked: ${decision.blockReason ?? 'Exceeds limits.'}`,
      400,
      'LIMIT_BLOCKED'
    );
  }

  const effectiveDate = getEffectiveDate(undefined, new Date());
  const referenceId = uuidv4();

  // STUB: In production this would call Nymbus / ACH processor
  logger.info('[INTEGRATION STUB] ACH transfer submission', { referenceId, amount: input.amount });

  const transfer = await prisma.achTransfer.create({
    data: {
      workspaceId: input.workspaceId,
      direction: input.direction,
      fromAccountId: input.fromAccountId,
      toExternalAccountId: input.toExternalAccountId,
      amount: input.amount,
      status: TransferStatus.Pending,
      referenceId,
      effectiveDate,
      isSameDay: input.isSameDay ?? false,
      isConsumerDebit: input.isConsumerDebit ?? false,
      consentId: input.consentId,
      idempotencyKey: input.idempotencyKey,
      limitDecisionId: decision.id,
    },
  });

  const responseBody = {
    transferId: transfer.id,
    status: transfer.status,
    referenceId: transfer.referenceId,
    effectiveDate: transfer.effectiveDate,
    isSameDay: transfer.isSameDay,
    createdAt: transfer.createdAt,
  };

  await prisma.idempotencyKey.create({
    data: {
      key: idempotencyKeyFull,
      responseBody: responseBody as unknown as Prisma.InputJsonValue,
      statusCode: 201,
    },
  });

  await createAuditEvent({
    userId: input.userId,
    eventType: AuditEventType.ACH_SUBMITTED,
    metadata: { transferId: transfer.id, amount: input.amount, referenceId },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    correlationId: input.correlationId,
  });

  return responseBody;
}

export async function listExternalAccounts(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) throw createError('Workspace access denied.', 403, 'FORBIDDEN');

  const accounts = await prisma.externalAccount.findMany({
    where: { workspaceId, status: { not: 'Unlinked' } },
  });

  return accounts.map((a) => ({
    id: a.id,
    displayName: a.displayName,
    maskedAccount: a.maskedAccount,
    routingLast4: a.routingLast4,
    provider: a.provider,
    status: a.status,
    createdAt: a.createdAt,
  }));
}

export async function initiateExternalAccountLink(input: LinkExternalAccountInput) {
  // STUB: In production this initiates Mastercard Finicity OAuth flow
  logger.info('[INTEGRATION STUB] Mastercard Finicity account link initiated', {
    userId: input.userId,
    workspaceId: input.workspaceId,
  });

  const account = await prisma.externalAccount.create({
    data: {
      userId: input.userId,
      workspaceId: input.workspaceId,
      displayName: input.displayName,
      maskedAccount: input.maskedAccount,
      routingLast4: input.routingLast4,
      provider: 'manual',
      status: 'Linked',
    },
  });

  return {
    id: account.id,
    displayName: account.displayName,
    maskedAccount: account.maskedAccount,
    routingLast4: account.routingLast4,
    status: account.status,
    createdAt: account.createdAt,
  };
}

export async function captureConsent(input: CaptureConsentInput) {
  const externalAccount = await prisma.externalAccount.findUnique({
    where: { id: input.externalAccountId },
  });
  if (!externalAccount) throw createError('External account not found.', 404, 'NOT_FOUND');
  if (externalAccount.userId !== input.userId) throw createError('Access denied.', 403, 'FORBIDDEN');

  const consent = await prisma.achConsent.create({
    data: {
      userId: input.userId,
      externalAccountId: input.externalAccountId,
      consentIp: input.consentIp,
      disclosuresVersion: input.disclosuresVersion,
      artifacts: (input.artifacts ?? {}) as Prisma.InputJsonValue,
    },
  });

  await createAuditEvent({
    userId: input.userId,
    eventType: AuditEventType.CONSENT_CAPTURED,
    metadata: { consentId: consent.id, externalAccountId: input.externalAccountId },
    ipAddress: input.consentIp,
  });

  return { consentId: consent.id, consentedAt: consent.consentedAt };
}

export async function unlinkExternalAccount(userId: string, accountId: string) {
  const account = await prisma.externalAccount.findUnique({ where: { id: accountId } });
  if (!account) throw createError('External account not found.', 404, 'NOT_FOUND');
  if (account.userId !== userId) throw createError('Access denied.', 403, 'FORBIDDEN');

  await prisma.externalAccount.update({
    where: { id: accountId },
    data: { status: 'Unlinked' },
  });
}
