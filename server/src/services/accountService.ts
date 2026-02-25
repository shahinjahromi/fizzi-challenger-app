import { prisma } from '../config/prisma'
import { ForbiddenError, NotFoundError } from '../utils/errors'

async function assertWorkspaceMember(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  })
  if (!membership) throw new ForbiddenError('Not a member of this workspace')
  return membership
}

export async function getWorkspaceAccounts(workspaceId: string, userId: string) {
  await assertWorkspaceMember(userId, workspaceId)

  return prisma.account.findMany({
    where: { workspaceId, isClosed: false },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getAccountById(id: string, userId: string) {
  const account = await prisma.account.findUnique({ where: { id } })
  if (!account) throw new NotFoundError('Account')

  await assertWorkspaceMember(userId, account.workspaceId)

  return account
}
