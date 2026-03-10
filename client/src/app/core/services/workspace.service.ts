import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Workspace } from '../../shared/models/workspace.model';

const API = '/api';
const WS_STORAGE_KEY = 'szb_workspace_id';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  readonly workspaces$ = new BehaviorSubject<Workspace[]>([]);
  readonly currentWorkspace$ = new BehaviorSubject<Workspace | null>(null);

  constructor(private http: HttpClient) {}

  loadWorkspaces(): Observable<{ data: Workspace[] }> {
    return this.http.get<{ data: Workspace[] }>(`${API}/workspaces`).pipe(
      tap((res) => {
        this.workspaces$.next(res.data);
        const savedId = localStorage.getItem(WS_STORAGE_KEY);
        if (savedId) {
          const found = res.data.find((w) => w.id === savedId);
          if (found) this.currentWorkspace$.next(found);
        }
      })
    );
  }

  selectWorkspace(workspace: Workspace): void {
    this.currentWorkspace$.next(workspace);
    localStorage.setItem(WS_STORAGE_KEY, workspace.id);
  }

  clearWorkspace(): void {
    this.currentWorkspace$.next(null);
    localStorage.removeItem(WS_STORAGE_KEY);
  }

  get currentWorkspaceId(): string | null {
    return this.currentWorkspace$.value?.id ?? null;
  }
}
