import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

//Import the Product interface
import { Setting } from '../interfaces/setting';
@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private baseUrl = 'http://localhost:3000/v1';

  constructor(private http: HttpClient) { }


  getSettings(): Observable<{ data: Setting[], total: number }> {
    return this.http.get<{ data: Setting[], total: number }>(`${this.baseUrl}/settings`);
  }
  getSettingById(id: string): Observable<Setting> {
    return this.http.get<Setting>(`${this.baseUrl}/settings/${id}`);
  }
  addSetting(product: Setting): Observable<Setting> {
    return this.http.post<Setting>(`${this.baseUrl}/settings`, product);
  }
  updateSetting(id: string, product: Setting): Observable<Setting> {
    return this.http.put<Setting>(`${this.baseUrl}/settings/${id}`, product);
  }
  deleteSetting(id: string): Observable<Setting> {
    return this.http.delete<Setting>(`${this.baseUrl}/settings/${id}`);
  }

}













