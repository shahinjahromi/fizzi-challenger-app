import { Prisma, AuditEventType } from '@prisma/client';
import prisma from '../db.js';

export interface AuditEventInput {
  userId: string;
  eventType: AuditEventType;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

export async function createAuditEvent(input: AuditEventInput): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      userId: input.userId,
      eventType: input.eventType,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      correlationId: input.correlationId,
    },
  });
}
