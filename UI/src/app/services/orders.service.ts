import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Order, OrderDetails } from '../interfaces/order';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  getOrders(queryParams: string= ''): Observable<{ data: Order[], total: number }> {
    return this.http.get<{ data: Order[], total: number }>(`${this.baseUrl}/orders${queryParams}`);
  }
  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/orders/${id}`);
  }
  
  getOrdersByStationId(stationId: string, vorlaufMinutes?: number): Observable<{ data: Order[], total: number }> {
    let params = new HttpParams().set('station_id', stationId);
    if (vorlaufMinutes != null) {
      const since = new Date(Date.now() - vorlaufMinutes * 60 * 1000).toISOString();
      params = params.set('since', since);
    }
    return this.http.get<{ data: Order[], total: number }>(`${this.baseUrl}/orders`, { params });
  }

  addOrder(order: Order): Observable<HttpResponse<Order>> {
    return this.http.post<Order>(`${this.baseUrl}/orders`, order,{observe: 'response'});
  }

  updateOrder(id: string, order: Order): Observable<HttpResponse<Order>> {
    return this.http.put<Order>(`${this.baseUrl}/orders/${id}`, order,{observe: 'response'});
  }

  patchOrder(id: string, string: OrderDetails) {
    return this.http.patch<OrderDetails>(`${this.baseUrl}/orders/${id}`,{"orders": string});
  }

  deleteOrder(id: string): Observable<HttpResponse<Order>> {
    return this.http.delete<Order>(`${this.baseUrl}/orders/${id}`,{observe: 'response'});
  }


}