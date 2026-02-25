import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Message {
  id: string;
  threadId: string;
  workspaceId: string;
  authorId: string;
  subject: string;
  body: string;
  isRead: boolean;
  isDraft: boolean;
  sentAt: string;
  author: { firstName: string; lastName: string; email: string };
}

@Injectable({ providedIn: 'root' })
export class MessagesService {
  private http = inject(HttpClient);

  listMessages(workspaceId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`/api/messages?workspaceId=${workspaceId}`);
  }

  createMessage(payload: { workspaceId: string; subject: string; body: string; threadId?: string; isDraft?: boolean }): Observable<Message> {
    return this.http.post<Message>('/api/messages', payload);
  }

  markRead(id: string): Observable<Message> {
    return this.http.patch<Message>(`/api/messages/${id}/read`, {});
  }
}
