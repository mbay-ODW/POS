import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface StatProduct {
  id: string;
  name: string;
  total_amount: number;
  order_count: number;
  total_revenue: number;
}

export interface StatisticsData {
  summary: { total_orders: number; total_revenue: number };
  orders_by_hour: { hour: number; count: number }[];
  orders_by_day: { date: string; count: number }[];
  heatmap: { weekday: number; hour: number; count: number }[];
  products: StatProduct[];
  stations: { station_id: string; name: string; order_count: number; total_revenue: number }[];
}

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getStatistics(params: { from?: string; to?: string; station_id?: string; product_id?: string } = {}): Observable<StatisticsData> {
    let httpParams = new HttpParams();
    if (params.from) httpParams = httpParams.set('from', params.from);
    if (params.to) httpParams = httpParams.set('to', params.to);
    if (params.station_id) httpParams = httpParams.set('station_id', params.station_id);
    if (params.product_id) httpParams = httpParams.set('product_id', params.product_id);
    return this.http.get<StatisticsData>(`${this.baseUrl}/statistics`, { params: httpParams });
  }
}
