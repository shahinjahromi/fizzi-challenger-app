export type LimitOutcome = 'Allowed' | 'Blocked';
export type TransferType = 'Internal' | 'ACH';

export interface LimitTier {
  id: string;
  name: string;
  dailyLimit: number;
  perTransactionLimit: number;
  monthlyLimit: number;
}

export interface LimitAssignment {
  id: string;
  subjectId: string;
  tierId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  overrideReason: string | null;
  assignedBy: string | null;
  createdAt: string;
}

export interface LimitDecision {
  id: string;
  subjectUserId: string;
  subjectAccountId: string;
  appliedTierIds: string[];
  appliedThresholdsSnapshot: Record<string, unknown>;
  evaluatedAt: string;
  outcome: LimitOutcome;
  blockReason: string | null;
  transferType: TransferType;
  amount: number;
}
