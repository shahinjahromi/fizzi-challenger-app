export type TransactionDirection = 'Credit' | 'Debit';
export type TransactionStatus   = 'Pending' | 'Posted' | 'Returned' | 'Cancelled';

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  direction: TransactionDirection;
  status: TransactionStatus;
  description: string;
  counterpart: string | null;
  referenceId: string | null;
  transferId: string | null;
  postedAt: string | null;
  createdAt: string;
}

export interface TransactionPage {
  data: Transaction[];
  nextCursor: string | null;
  total: number;
}

export interface TransactionParams {
  status?: string;
  cursor?: string;
  limit?: number;
  search?: string;
}
