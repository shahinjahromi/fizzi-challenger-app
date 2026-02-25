import { prisma } from '../config/prisma'
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors'
import { LimitSubjectType, TransactionDirection } from '@prisma/client'

export async function getLimitTiers() {
  return prisma.limitTier.findMany({ orderBy: { perTxnMaxCents: 'asc' } })
}

export async function getEffectiveLimitForAccount(accountId: string, userId: string) {
  const account = await prisma.account.findUnique({ where: { id: accountId } })
  if (!account) throw new NotFoundError('Account')

  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: account.workspaceId } },
  })
  if (!membership) throw new ForbiddenError('Not a member of this workspace')

  const now = new Date()

  // Collect all active USER and ACCOUNT assignments
  const userAssignments = await prisma.limitAssignment.findMany({
    where: {
      subjectType: LimitSubjectType.USER,
      userId,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    },
    include: { tier: true },
  })

  const accountAssignments = await prisma.limitAssignment.findMany({
    where: {
      subjectType: LimitSubjectType.ACCOUNT,
      accountId,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    },
    include: { tier: true },
  })

  const allTiers = [...userAssignments, ...accountAssignments].map((a) => a.tier)

  if (allTiers.length > 0) {
    // Most restrictive: lowest perTxnMaxCents
    return allTiers.reduce((min, t) => (t.perTxnMaxCents < min.perTxnMaxCents ? t : min))
  }

  // Tenure-based fallback
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new NotFoundError('User')

  const tenureDays = Math.floor((now.getTime() - user.tenureStartDate.getTime()) / (1000 * 60 * 60 * 24))
  const tierName = tenureDays >= 90 ? 'standard-90plus' : 'new-tenure'

  const fallbackTier = await prisma.limitTier.findUnique({ where: { name: tierName } })
  if (!fallbackTier) throw new NotFoundError('LimitTier')

  return fallbackTier
}

export async function enforceLimits(
  accountId: string,
  userId: string,
  amountCents: number,
  direction: TransactionDirection,
) {
  const tier = await getEffectiveLimitForAccount(accountId, userId)

  if (amountCents > tier.perTxnMaxCents) {
    throw new ValidationError(
      `Amount exceeds per-transaction limit of $${(tier.perTxnMaxCents / 100).toFixed(2)}`,
    )
  }

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const dailySum = await prisma.transaction.aggregate({
    where: {
      accountId,
      direction,
      status: { in: ['PENDING', 'HOLD', 'POSTED'] },
      createdAt: { gte: startOfDay },
    },
    _sum: { amountCents: true },
  })

  const dailyTotal = (dailySum._sum.amountCents ?? 0) + amountCents
  const dailyMax = direction === TransactionDirection.CREDIT
    ? tier.dailyCreditMaxCents
    : tier.dailyDebitMaxCents

  if (dailyTotal > dailyMax) {
    throw new ValidationError(
      `Amount would exceed daily ${direction.toLowerCase()} limit of $${(dailyMax / 100).toFixed(2)}`,
    )
  }

  return tier
}
