import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Account {
  id: string;
  workspaceId: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'MONEY_MARKET';
  accountNumber: string;
  routingNumber: string;
  availableCents: number;
  currentCents: number;
  isClosed: boolean;
  interestRate: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private http = inject(HttpClient);

  getWorkspaceAccounts(workspaceId: string): Observable<Account[]> {
    return this.http.get<Account[]>(`/api/accounts?workspaceId=${workspaceId}`);
  }

  getAccountById(id: string): Observable<Account> {
    return this.http.get<Account>(`/api/accounts/${id}`);
  }
}
