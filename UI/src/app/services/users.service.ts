import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface User {
  _id?: string;
  username: string;
  role: 'manager' | 'personal';
  active: boolean;
  creationTime?: Date;
  lastLogin?: Date;
}

export interface CreateUserDto {
  username: string;
  password: string;
  role: 'manager' | 'personal';
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private baseUrl = environment.baseUrl;
  constructor(private http: HttpClient) {}

  getUsers(): Observable<{ data: User[]; total: number }> {
    return this.http.get<{ data: User[]; total: number }>(`${this.baseUrl}/users`);
  }

  createUser(dto: CreateUserDto): Observable<HttpResponse<any>> {
    return this.http.post<any>(`${this.baseUrl}/users`, dto, { observe: 'response' });
  }

  updateUser(id: string, patch: Partial<User & { password?: string }>): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/${id}`, patch);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`);
  }
}
