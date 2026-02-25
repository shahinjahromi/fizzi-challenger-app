import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Profile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  standing: string;
  tenureStartDate: string;
  businessAddressLine1: string | null;
  businessAddressLine2: string | null;
  businessCity: string | null;
  businessState: string | null;
  businessPostalCode: string | null;
  businessCountry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  username?: string;
  firstName?: string;
  lastName?: string;
  businessAddressLine1?: string | null;
  businessAddressLine2?: string | null;
  businessCity?: string | null;
  businessState?: string | null;
  businessPostalCode?: string | null;
  businessCountry?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);

  getProfile(): Observable<Profile> {
    return this.http.get<Profile>('/api/profile');
  }

  updateProfile(payload: UpdateProfilePayload): Observable<Profile> {
    return this.http.patch<Profile>('/api/profile', payload);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/profile/change-password', {
      currentPassword,
      newPassword,
    });
  }
}
