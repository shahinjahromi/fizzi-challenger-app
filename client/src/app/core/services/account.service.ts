import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account } from '../../shared/models/account.model';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class AccountService {
  constructor(private http: HttpClient) {}

  getAccounts(workspaceId: string): Observable<{ data: Account[] }> {
    return this.http.get<{ data: Account[] }>(
      `${API}/workspaces/${workspaceId}/accounts`
    );
  }

  getAccount(accountId: string): Observable<Account> {
    return this.http.get<Account>(`${API}/accounts/${accountId}`);
  }
}
