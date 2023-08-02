import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

//Import the Order interface
import { Order } from '../models/orders';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  orderCreated: EventEmitter<boolean> = new EventEmitter<boolean>();
  orderEdited: EventEmitter<boolean> = new EventEmitter<boolean>();
  orderDeleted: EventEmitter<boolean> = new EventEmitter<boolean>();

  private baseUrl = 'http://localhost:3000/v1';

  constructor(private http: HttpClient) { }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/orders`);
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
