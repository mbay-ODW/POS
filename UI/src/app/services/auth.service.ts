import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

export interface AuthUser {
  username: string;
  role: 'manager' | 'personal';
  token: string;
}

const STORAGE_KEY = 'pos_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.baseUrl}/auth/login`, { username, password }).pipe(
      tap(res => localStorage.setItem(STORAGE_KEY, JSON.stringify(res)))
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.router.navigate(['/login']);
  }

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  getToken(): string | null {
    return this.getUser()?.token ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isManager(): boolean {
    return this.getUser()?.role === 'manager';
  }

  hasRole(role: string): boolean {
    return this.getUser()?.role === role;
  }
}
