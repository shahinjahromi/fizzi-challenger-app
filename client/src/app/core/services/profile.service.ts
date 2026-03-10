import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../shared/models/user.model';

const API = '/api';

export interface SecurityCenter {
  username: string;
  twoStepEnabled: boolean;
  twoStepMethod: string | null;
  trustedDevicesCount: number;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private http: HttpClient) {}

  getProfile(): Observable<User> {
    return this.http.get<User>(`${API}/profile`);
  }

  getSecurityCenter(): Observable<SecurityCenter> {
    return this.http.get<SecurityCenter>(`${API}/profile/security`);
  }
}
