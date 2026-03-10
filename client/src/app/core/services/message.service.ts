import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Thread, Message } from '../../shared/models/message.model';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class MessageService {
  constructor(private http: HttpClient) {}

  getThreads(workspaceId: string): Observable<{ data: Thread[] }> {
    const params = new HttpParams().set('workspaceId', workspaceId);
    return this.http.get<{ data: Thread[] }>(`${API}/messages/threads`, { params });
  }

  createThread(workspaceId: string, subject: string): Observable<Thread> {
    return this.http.post<Thread>(`${API}/messages/threads`, {
      workspaceId,
      subject,
    });
  }

  getThread(threadId: string, workspaceId: string): Observable<Thread> {
    const params = new HttpParams().set('workspaceId', workspaceId);
    return this.http.get<Thread>(`${API}/messages/threads/${threadId}`, {
      params,
    });
  }

  sendMessage(
    threadId: string,
    workspaceId: string,
    body: string
  ): Observable<Message> {
    return this.http.post<Message>(
      `${API}/messages/threads/${threadId}/messages`,
      { workspaceId, body }
    );
  }

  markRead(threadId: string, workspaceId: string): Observable<void> {
    return this.http.post<void>(
      `${API}/messages/threads/${threadId}/read`,
      { workspaceId }
    );
  }
}
