import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Workspace {
  id: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class WorkspacesService {
  private http = inject(HttpClient);

  getMyWorkspaces(): Observable<Workspace[]> {
    return this.http.get<Workspace[]>('/api/workspaces');
  }
}
