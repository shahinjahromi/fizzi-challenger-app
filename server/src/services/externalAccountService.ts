import { prisma } from '../config/prisma'
import { ForbiddenError } from '../utils/errors'

export async function listExternalAccounts(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  })
  if (!membership) throw new ForbiddenError('Not a member of this workspace')

  return prisma.externalAccount.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  })
}
