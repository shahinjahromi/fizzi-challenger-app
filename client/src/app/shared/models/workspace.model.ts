import { UserRole } from './user.model';

export interface Workspace {
  id: string;
  name: string;
  role: UserRole;
  createdAt: string;
}
