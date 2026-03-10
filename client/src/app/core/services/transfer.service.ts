import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InternalTransfer, TransferRequest } from '../../shared/models/transfer.model';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class TransferService {
  constructor(private http: HttpClient) {}

  submitInternalTransfer(
    request: TransferRequest
  ): Observable<InternalTransfer> {
    const headers = new HttpHeaders({
      'Idempotency-Key': crypto.randomUUID(),
    });
    return this.http.post<InternalTransfer>(
      `${API}/transfers/internal`,
      request,
      { headers }
    );
  }

  getTransfers(workspaceId: string): Observable<{ data: InternalTransfer[] }> {
    const params = new HttpParams().set('workspaceId', workspaceId);
    return this.http.get<{ data: InternalTransfer[] }>(`${API}/transfers`, {
      params,
    });
  }
}
