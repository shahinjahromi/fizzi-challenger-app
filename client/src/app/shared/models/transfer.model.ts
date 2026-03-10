export type TransferStatus = 'Pending' | 'Settled' | 'Failed' | 'Cancelled' | 'Returned';

export interface InternalTransfer {
  id?: string;
  transferId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  memo: string | null;
  status: TransferStatus;
  referenceId: string;
  effectiveDate: string;
  cutoffApplied: boolean;
  createdAt: string;
}

export interface TransferRequest {
  workspaceId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  memo?: string;
  requestedExecutionDate?: string;
}
