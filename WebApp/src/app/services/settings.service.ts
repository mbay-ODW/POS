import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

//Import the Setting interface
import { Setting } from '../models/settings';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private baseUrl = 'http://localhost:3000/v1';
  settingEdited: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(private http: HttpClient) { }

  getSettings(): Observable<Setting[]> {
    return this.http.get<Setting[]>(`${this.baseUrl}/settings`);
  }
  getSettingById(id: string): Observable<Setting> {
    return this.http.get<Setting>(`${this.baseUrl}/settings/${id}`);
  }
  addSetting(setting: Setting): Observable<Setting> {
    return this.http.post<Setting>(`${this.baseUrl}/settings`, setting);
  }
  updateSetting(id: string, setting: Setting): Observable<Setting> {
    return this.http.put<Setting>(`${this.baseUrl}/settings/${id}`, setting);
  }
}
