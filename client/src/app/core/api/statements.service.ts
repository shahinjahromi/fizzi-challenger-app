import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Statement {
  id: string;
  accountId: string;
  month: number;
  year: number;
  pdfUrl: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class StatementsService {
  private http = inject(HttpClient);

  listStatements(accountId: string): Observable<Statement[]> {
    return this.http.get<Statement[]>(`/api/statements?accountId=${accountId}`);
  }

  downloadPdf(statementId: string): Observable<Blob> {
    return this.http.get(`/api/statements/${statementId}/download`, { responseType: 'blob' });
  }
}
