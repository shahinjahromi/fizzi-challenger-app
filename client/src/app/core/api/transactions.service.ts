import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Transaction {
  id: string;
  accountId: string;
  direction: 'CREDIT' | 'DEBIT';
  type: string;
  status: 'PENDING' | 'HOLD' | 'POSTED' | 'RETURNED' | 'CANCELLED';
  amountCents: number;
  description: string | null;
  postedAt: string | null;
  createdAt: string;
}

export interface TransactionPage {
  items: Transaction[];
  nextCursor: string | null;
}

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private http = inject(HttpClient);

  getAccountTransactions(
    accountId: string,
    opts?: { status?: string; limit?: number; cursor?: string }
  ): Observable<TransactionPage> {
    let params = new HttpParams().set('accountId', accountId);
    if (opts?.status) params = params.set('status', opts.status);
    if (opts?.limit) params = params.set('limit', String(opts.limit));
    if (opts?.cursor) params = params.set('cursor', opts.cursor);
    return this.http.get<TransactionPage>('/api/transactions', { params });
  }
}
