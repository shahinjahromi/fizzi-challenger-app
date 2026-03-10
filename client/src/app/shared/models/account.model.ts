export type AccountType   = 'Checking' | 'Savings';
export type AccountStatus = 'Active' | 'Frozen' | 'Closed';

export interface Account {
  id: string;
  name: string;
  last4: string;
  routingLast4: string;
  type: AccountType;
  availableBalance: number;
  currentBalance: number;
  interestRate: number;
  interestEarned: number;
  isMoveMoneyEligible: boolean;
  status: AccountStatus;
  isClosed: boolean;
  workspaceId?: string;
  createdAt?: string;
}
