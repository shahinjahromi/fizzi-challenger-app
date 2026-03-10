export type UserRole = 'PrimaryAdmin' | 'AuthorizedUser';

export interface WorkspaceMembership {
  id: string;
  name: string;
  role: UserRole;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  lastLoginAt: string | null;
  tenureStartDate?: string;
  workspaces: WorkspaceMembership[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}
