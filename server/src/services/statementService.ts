import prisma from '../db.js';
import { createError } from '../types/index.js';
import { createAuditEvent } from './auditService.js';
import { AuditEventType } from '@prisma/client';
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

export async function listStatements(userId: string, accountId: string) {
  await assertAccountAccess(userId, accountId);

  const statements = await prisma.statement.findMany({
    where: { accountId },
    orderBy: { month: 'desc' },
    select: { id: true, month: true, createdAt: true },
  });

  return statements;
}

export async function downloadStatement(userId: string, statementId: string) {
  const statement = await prisma.statement.findUnique({ where: { id: statementId } });
  if (!statement) throw createError('Statement not found.', 404, 'NOT_FOUND');

  await assertAccountAccess(userId, statement.accountId);

  await createAuditEvent({
    userId,
    eventType: AuditEventType.STATEMENT_DOWNLOAD,
    metadata: { statementId, month: statement.month },
  });

  // STUB: In production this would fetch from S3 or document storage
  logger.info('[INTEGRATION STUB] Statement download requested', { statementId });

  return {
    statementId,
    month: statement.month,
    downloadUrl: statement.downloadUrl,
    contentType: 'application/pdf',
    note: 'Integration stub — attach real PDF from document storage in production.',
  };
}
