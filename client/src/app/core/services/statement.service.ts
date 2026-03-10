import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Statement, StatementDownload } from '../../shared/models/statement.model';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class StatementService {
  constructor(private http: HttpClient) {}

  getStatements(accountId: string): Observable<{ data: Statement[] }> {
    return this.http.get<{ data: Statement[] }>(
      `${API}/accounts/${accountId}/statements`
    );
  }

  downloadStatement(statementId: string): Observable<StatementDownload> {
    return this.http.get<StatementDownload>(
      `${API}/statements/${statementId}/download`
    );
  }
}
