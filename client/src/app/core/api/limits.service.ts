import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LimitTier {
  id: string;
  name: string;
  displayName: string;
  perTxnMaxCents: number;
  dailyCreditMaxCents: number;
  dailyDebitMaxCents: number;
  monthlyCreditMaxCents: number;
  monthlyDebitMaxCents: number;
  velocityCount: number;
  velocityWindowMinutes: number;
  sameDayAchMaxCents: number;
}

@Injectable({ providedIn: 'root' })
export class LimitsService {
  private http = inject(HttpClient);

  getLimitTiers(): Observable<LimitTier[]> {
    return this.http.get<LimitTier[]>('/api/limits/tiers');
  }

  getEffectiveLimit(accountId: string): Observable<LimitTier> {
    return this.http.get<LimitTier>(`/api/limits/effective?accountId=${accountId}`);
  }
}
