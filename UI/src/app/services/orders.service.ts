import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Order } from '../interfaces/order';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private baseUrl = 'http://localhost:3000/v1';

  constructor(private http: HttpClient) { }

  getOrders(page: number, pageSize: number): Observable<{ data: Order[], total: number }> {
    let params = new HttpParams();

    if (page != null && pageSize != null) {
      const start = page * pageSize;
      params = params.set('skip', start.toString());
      params = params.set('pageSize', pageSize.toString());
    }

    return this.http.get<{ data: Order[], total: number }>(`${this.baseUrl}/orders`, { params });
  }
  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/orders/${id}`);
  }
  addOrder(order: Order): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders`, order);
  }
  updateOrder(id: string, order: Order): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/orders/${id}`, order);
  }
  deleteOrder(id: string): Observable<Order> {
    return this.http.delete<Order>(`${this.baseUrl}/orders/${id}`);
  }


}