import { prisma } from '../config/prisma'
import { AuditEventType } from '@prisma/client'
import type { Prisma } from '@prisma/client'

export async function writeAuditEvent(params: {
  type: AuditEventType
  userId?: string
  workspaceId?: string
  correlationId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Prisma.InputJsonValue
}) {
  const { type, userId, workspaceId, correlationId, ipAddress, userAgent, metadata } = params
  await prisma.auditEvent.create({
    data: {
      type,
      userId,
      workspaceId,
      correlationId,
      ipAddress,
      userAgent,
      metadata: metadata ?? undefined,
    },
  })
}
