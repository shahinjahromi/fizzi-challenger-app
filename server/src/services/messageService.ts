import { prisma } from '../config/prisma'
import { ForbiddenError, NotFoundError } from '../utils/errors'
import { randomUUID } from 'crypto'

interface CreateMessageBody {
  workspaceId: string
  subject: string
  body: string
  threadId?: string
  isDraft?: boolean
}

export async function listMessages(workspaceId: string, userId: string, opts?: { limit?: number }) {
  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  })
  if (!membership) throw new ForbiddenError('Not a member of this workspace')

  return prisma.message.findMany({
    where: { workspaceId },
    orderBy: { sentAt: 'desc' },
    take: opts?.limit ?? 50,
    include: { author: { select: { firstName: true, lastName: true, email: true } } },
  })
}

export async function createMessage(userId: string, body: CreateMessageBody) {
  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: body.workspaceId } },
  })
  if (!membership) throw new ForbiddenError('Not a member of this workspace')

  return prisma.message.create({
    data: {
      threadId: body.threadId ?? randomUUID(),
      workspaceId: body.workspaceId,
      authorId: userId,
      subject: body.subject,
      body: body.body,
      isDraft: body.isDraft ?? false,
    },
  })
}

export async function markRead(id: string, userId: string) {
  const message = await prisma.message.findUnique({ where: { id } })
  if (!message) throw new NotFoundError('Message')

  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: message.workspaceId } },
  })
  if (!membership) throw new ForbiddenError('Not a member of this workspace')

  return prisma.message.update({ where: { id }, data: { isRead: true } })
}
