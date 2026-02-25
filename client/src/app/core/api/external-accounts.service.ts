import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ExternalAccount {
  id: string;
  workspaceId: string;
  nickname: string | null;
  type: 'CHECKING' | 'SAVINGS';
  maskedNumber: string;
  routingNumber: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LinkExternalAccountResponse {
  externalAccount: ExternalAccount;
  created: boolean;
}

@Injectable({ providedIn: 'root' })
export class ExternalAccountsService {
  private http = inject(HttpClient);

  list(workspaceId: string): Observable<ExternalAccount[]> {
    return this.http.get<ExternalAccount[]>(`/api/external-accounts?workspaceId=${workspaceId}`);
  }

  linkStripeConnect(workspaceId: string, nickname?: string): Observable<LinkExternalAccountResponse> {
    return this.http.post<LinkExternalAccountResponse>('/api/external-accounts', {
      workspaceId,
      nickname,
    });
  }
}
