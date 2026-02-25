import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InternalTransferPayload {
  fromAccountId: string;
  toAccountId: string;
  amountCents: number;
  description?: string;
}

export interface AchTransferPayload {
  accountId: string;
  externalAccountId: string;
  direction: 'CREDIT' | 'DEBIT';
  amountCents: number;
  sameDayAch?: boolean;
  description?: string;
}

export interface AchTransferResponse {
  txn: unknown;
  note?: string;
  stripePayoutId?: string;
  stripePayoutStatus?: string;
}

@Injectable({ providedIn: 'root' })
export class TransfersService {
  private http = inject(HttpClient);

  initiateInternal(payload: InternalTransferPayload): Observable<unknown> {
    return this.http.post('/api/transfers/internal', payload);
  }

  initiateAch(payload: AchTransferPayload): Observable<AchTransferResponse> {
    return this.http.post<AchTransferResponse>('/api/transfers/ach', payload);
  }
}
