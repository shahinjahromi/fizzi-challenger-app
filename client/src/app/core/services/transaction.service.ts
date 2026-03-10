import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TransactionPage, TransactionParams } from '../../shared/models/transaction.model';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  constructor(private http: HttpClient) {}

  getTransactions(
    accountId: string,
    params: TransactionParams = {}
  ): Observable<TransactionPage> {
    let httpParams = new HttpParams();
    if (params.status)  httpParams = httpParams.set('status',  params.status);
    if (params.cursor)  httpParams = httpParams.set('cursor',  params.cursor);
    if (params.limit)   httpParams = httpParams.set('limit',   String(params.limit));
    if (params.search)  httpParams = httpParams.set('search',  params.search);

    return this.http.get<TransactionPage>(
      `${API}/accounts/${accountId}/transactions`,
      { params: httpParams }
    );
  }
}
