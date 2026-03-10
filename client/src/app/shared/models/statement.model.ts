export interface Statement {
  id: string;
  month: string;
  createdAt: string;
}

export interface StatementDownload {
  statementId: string;
  month: string;
  downloadUrl: string;
  contentType: string;
  note: string;
}
