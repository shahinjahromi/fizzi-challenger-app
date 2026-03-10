import prisma from '../db.js';
import { createError } from '../types/index.js';

export async function listThreads(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) throw createError('Workspace access denied.', 403, 'FORBIDDEN');

  const threads = await prisma.messageThread.findMany({
    where: { workspaceId },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return threads.map((t) => {
    const unreadCount = 0; // simplified; full implementation counts per-user unread
    return {
      id: t.id,
      subject: t.subject,
      createdAt: t.createdAt,
      latestMessage: t.messages[0]
        ? { fromDisplay: t.messages[0].fromDisplay, sentAt: t.messages[0].sentAt }
        : null,
      unreadCount,
    };
  });
}

export async function getThread(userId: string, workspaceId: string, threadId: string) {
  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) throw createError('Workspace access denied.', 403, 'FORBIDDEN');

  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!thread || thread.workspaceId !== workspaceId) {
    throw createError('Thread not found.', 404, 'NOT_FOUND');
  }

  return {
    id: thread.id,
    subject: thread.subject,
    createdAt: thread.createdAt,
    messages: thread.messages.map((m) => ({
      id: m.id,
      fromDisplay: m.fromDisplay,
      body: m.body,
      isRead: m.isRead,
      isDraft: m.isDraft,
      sentAt: m.sentAt,
      createdAt: m.createdAt,
    })),
  };
}

export async function sendMessage(
  userId: string,
  workspaceId: string,
  threadId: string,
  fromDisplay: string,
  body: string
) {
  if (body.length > 2000) {
    throw createError('Message body exceeds 2000 character limit.', 400, 'MESSAGE_TOO_LONG');
  }

  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) throw createError('Workspace access denied.', 403, 'FORBIDDEN');

  const thread = await prisma.messageThread.findUnique({ where: { id: threadId } });
  if (!thread || thread.workspaceId !== workspaceId) {
    throw createError('Thread not found.', 404, 'NOT_FOUND');
  }

  const message = await prisma.message.create({
    data: {
      threadId,
      fromDisplay,
      body,
      isRead: false,
      isDraft: false,
      sentAt: new Date(),
    },
  });

  return {
    id: message.id,
    threadId: message.threadId,
    fromDisplay: message.fromDisplay,
    body: message.body,
    sentAt: message.sentAt,
    createdAt: message.createdAt,
  };
}

export async function markThreadRead(userId: string, workspaceId: string, threadId: string) {
  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) throw createError('Workspace access denied.', 403, 'FORBIDDEN');

  const thread = await prisma.messageThread.findUnique({ where: { id: threadId } });
  if (!thread || thread.workspaceId !== workspaceId) {
    throw createError('Thread not found.', 404, 'NOT_FOUND');
  }

  await prisma.message.updateMany({
    where: { threadId, isRead: false },
    data: { isRead: true },
  });
}

export async function createThread(userId: string, workspaceId: string, subject: string) {
  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) throw createError('Workspace access denied.', 403, 'FORBIDDEN');

  const thread = await prisma.messageThread.create({
    data: { workspaceId, subject },
  });

  return { id: thread.id, subject: thread.subject, createdAt: thread.createdAt };
}
