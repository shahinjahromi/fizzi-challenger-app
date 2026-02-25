import { prisma } from '../config/prisma'
import { ForbiddenError, NotFoundError } from '../utils/errors'
import { TransactionStatus } from '@prisma/client'

export async function getAccountTransactions(
  accountId: string,
  userId: string,
  opts: { status?: TransactionStatus; limit?: number; cursor?: string },
) {
  const account = await prisma.account.findUnique({ where: { id: accountId } })
  if (!account) throw new NotFoundError('Account')

  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: account.workspaceId } },
  })
  if (!membership) throw new ForbiddenError('Not a member of this workspace')

  const limit = Math.min(opts.limit ?? 50, 200)

  const transactions = await prisma.transaction.findMany({
    where: {
      accountId,
      ...(opts.status ? { status: opts.status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  })

  const hasMore = transactions.length > limit
  const items = hasMore ? transactions.slice(0, limit) : transactions
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return { items, nextCursor }
}
