export interface Message {
  id: string;
  fromDisplay: string;
  body: string;
  isRead: boolean;
  isDraft: boolean;
  sentAt: string | null;
  createdAt: string;
}

export interface LatestMessage {
  fromDisplay: string;
  sentAt: string | null;
}

export interface Thread {
  id: string;
  subject: string;
  createdAt: string;
  latestMessage: LatestMessage | null;
  unreadCount: number;
  messages?: Message[];
}
