import { Prisma, LimitOutcome, TransferType } from '@prisma/client';
import prisma from '../db.js';
import { createError } from '../types/index.js';
import { createAuditEvent } from './auditService.js';
import { AuditEventType } from '@prisma/client';

export interface LimitDecideInput {
  userId: string;
  accountId: string;
  amount: number;
  transferType: 'Internal' | 'ACH';
  isSameDay?: boolean;
  correlationId?: string;
}

export interface ThresholdsSnapshot {
  perTxnMax: number;
  dailyCreditMax: number;
  dailyDebitMax: number;
  monthlyCreditMax: number;
  monthlyDebitMax: number;
  velocityMax: number;
  velocityWindowMinutes: number;
  sameDayAchMax: number;
}

export interface DecisionResult {
  id: string;
  outcome: 'Allowed' | 'Blocked';
  blockReason?: string;
  friendlyReason?: string;
  appliedTierSummary: Array<{ tierId: string; tierName: string; friendlyName: string }>;
  thresholdsSnapshot: ThresholdsSnapshot;
}

/**
 * Returns the most restrictive snapshot from a set of tiers
 * (minimum of each numeric limit).
 */
function mergeToMostRestrictive(tiers: Array<{
  id: string;
  name: string;
  friendlyName: string;
  perTxnMax: Prisma.Decimal;
  dailyCreditMax: Prisma.Decimal;
  dailyDebitMax: Prisma.Decimal;
  monthlyCreditMax: Prisma.Decimal;
  monthlyDebitMax: Prisma.Decimal;
  velocityMax: Prisma.Decimal;
  velocityWindowMinutes: number;
  sameDayAchMax: Prisma.Decimal;
}>): ThresholdsSnapshot {
  return {
    perTxnMax: Math.min(...tiers.map((t) => Number(t.perTxnMax))),
    dailyCreditMax: Math.min(...tiers.map((t) => Number(t.dailyCreditMax))),
    dailyDebitMax: Math.min(...tiers.map((t) => Number(t.dailyDebitMax))),
    monthlyCreditMax: Math.min(...tiers.map((t) => Number(t.monthlyCreditMax))),
    monthlyDebitMax: Math.min(...tiers.map((t) => Number(t.monthlyDebitMax))),
    velocityMax: Math.min(...tiers.map((t) => Number(t.velocityMax))),
    velocityWindowMinutes: Math.min(...tiers.map((t) => t.velocityWindowMinutes)),
    sameDayAchMax: Math.min(...tiers.map((t) => Number(t.sameDayAchMax))),
  };
}

/** Compute how many days have elapsed since tenureStartDate */
function tenureDays(tenureStartDate: Date): number {
  return Math.floor((Date.now() - tenureStartDate.getTime()) / (1000 * 60 * 60 * 24));
}

export async function decideLimits(input: LimitDecideInput): Promise<DecisionResult> {
  const now = new Date();

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) throw createError('User not found.', 404, 'NOT_FOUND');

  // Gather explicit tier assignments for user and account
  const userAssignments = await prisma.limitAssignment.findMany({
    where: {
      subjectType: 'User',
      subjectId: input.userId,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    },
    include: { tier: true },
  });

  const accountAssignments = await prisma.limitAssignment.findMany({
    where: {
      subjectType: 'Account',
      subjectId: input.accountId,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    },
    include: { tier: true },
  });

  const explicitTiers = [...userAssignments, ...accountAssignments].map((a) => a.tier);

  let tiersToApply = explicitTiers;

  // Tenure defaulting: if no explicit assignment, apply tenure-based tier
  if (tiersToApply.length === 0) {
    const days = tenureDays(user.tenureStartDate);
    const defaultTierName = days < 90 ? 'New-Tenure' : 'Standard-90+';
    const defaultTier = await prisma.limitTier.findUnique({ where: { name: defaultTierName } });
    if (defaultTier) tiersToApply = [defaultTier];
  }

  if (tiersToApply.length === 0) {
    throw createError('No applicable limit tier found.', 500, 'NO_LIMIT_TIER');
  }

  const snapshot = mergeToMostRestrictive(tiersToApply);

  // Evaluate against snapshot
  let outcome: 'Allowed' | 'Blocked' = 'Allowed';
  let blockReason: string | undefined;

  if (input.amount > snapshot.perTxnMax) {
    outcome = 'Blocked';
    blockReason = `Amount $${input.amount} exceeds per-transaction maximum of $${snapshot.perTxnMax}.`;
  }

  if (input.isSameDay && input.transferType === 'ACH' && input.amount > snapshot.sameDayAchMax) {
    outcome = 'Blocked';
    blockReason = `Same-day ACH amount $${input.amount} exceeds maximum of $${snapshot.sameDayAchMax}.`;
  }

  const appliedTierIds = tiersToApply.map((t) => t.id);
  const appliedTierSummary = tiersToApply.map((t) => ({
    tierId: t.id,
    tierName: t.name,
    friendlyName: t.friendlyName,
  }));

  const decision = await prisma.limitDecision.create({
    data: {
      subjectUserId: input.userId,
      subjectAccountId: input.accountId,
      appliedTierIds,
      appliedThresholdsSnapshot: snapshot as unknown as Prisma.InputJsonValue,
      outcome: outcome as LimitOutcome,
      blockReason,
      transferType: input.transferType as TransferType,
      amount: input.amount,
    },
  });

  await createAuditEvent({
    userId: input.userId,
    eventType: AuditEventType.LIMIT_DECISION,
    metadata: {
      decisionId: decision.id,
      outcome,
      blockReason,
      amount: input.amount,
      transferType: input.transferType,
    },
    correlationId: input.correlationId,
  });

  return {
    id: decision.id,
    outcome,
    blockReason,
    friendlyReason: blockReason,
    appliedTierSummary,
    thresholdsSnapshot: snapshot,
  };
}

export async function listTiers() {
  const tiers = await prisma.limitTier.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  return tiers.map((t) => ({
    id: t.id,
    name: t.name,
    friendlyName: t.friendlyName,
    perTxnMax: Number(t.perTxnMax),
    dailyCreditMax: Number(t.dailyCreditMax),
    dailyDebitMax: Number(t.dailyDebitMax),
    monthlyCreditMax: Number(t.monthlyCreditMax),
    monthlyDebitMax: Number(t.monthlyDebitMax),
    velocityMax: Number(t.velocityMax),
    velocityWindowMinutes: t.velocityWindowMinutes,
    sameDayAchMax: Number(t.sameDayAchMax),
    isActive: t.isActive,
  }));
}

export async function listAssignments(subjectType?: string, subjectId?: string) {
  const where: Prisma.LimitAssignmentWhereInput = {};
  if (subjectType) where.subjectType = subjectType as Prisma.EnumLimitSubjectTypeFilter;
  if (subjectId) where.subjectId = subjectId;

  const assignments = await prisma.limitAssignment.findMany({
    where,
    include: { tier: true },
    orderBy: { createdAt: 'desc' },
  });

  return assignments.map((a) => ({
    id: a.id,
    subjectType: a.subjectType,
    subjectId: a.subjectId,
    tierId: a.tierId,
    tierName: a.tier.name,
    effectiveFrom: a.effectiveFrom,
    effectiveTo: a.effectiveTo,
    overrideReason: a.overrideReason,
    assignedBy: a.assignedBy,
    createdAt: a.createdAt,
  }));
}
