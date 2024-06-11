import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Station } from '../interfaces/station';

@Injectable({
  providedIn: 'root'
})
export class StationsService {

  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  getStations(page?: number, pageSize?: number): Observable<{ data: Station[], total: number }> {
    let params = new HttpParams();

    if (page != null && pageSize != null) {
      const start = page * pageSize;
      params = params.set('skip', start.toString());
      params = params.set('pageSize', pageSize.toString());
    }

    return this.http.get<{ data: Station[], total: number }>(`${this.baseUrl}/stations`, { params });
  }
  getStationById(id: string): Observable<Station> {
    return this.http.get<Station>(`${this.baseUrl}/stations/${id}`);
  }
  addStation(cart: Station): Observable<HttpResponse<Station>> {
    return this.http.post<Station>(`${this.baseUrl}/stations`, cart,{observe: 'response'});
  }
  updateStation(id: string, cart: Station): Observable<HttpResponse<Station>> {
    return this.http.put<Station>(`${this.baseUrl}/stations/${id}`, cart,{observe: 'response'});
  }

  deleteStation(id: string): Observable<HttpResponse<Station>> {
    return this.http.delete<Station>(`${this.baseUrl}/stations/${id}`,{observe: 'response'});
  }
}
