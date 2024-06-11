import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

//Import the Product interface
import { environment } from '../environments/environment';

import { Cart } from '../interfaces/cart';
import { Order, OrderDetails } from '../interfaces/order';

@Injectable({
  providedIn: 'root'
})
export class CartsService {

  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  getCarts(queryParams: string= ''): Observable<{ data: Cart[], total: number }> {
    return this.http.get<{ data: Cart[], total: number }>(`${this.baseUrl}/carts${queryParams}`);
  }

  getCartById(id: string): Observable<Cart> {
    return this.http.get<Cart>(`${this.baseUrl}/carts/${id}`);
  }

  addCart(cart: Cart): Observable<Cart> {
    return this.http.post<Cart>(`${this.baseUrl}/carts`, cart);
  }

  updateCart(id: string, cart: Cart): Observable<Cart> {
    return this.http.put<Cart>(`${this.baseUrl}/carts/${id}`, cart);
  }

  patchCart(id: string, string: OrderDetails) {
    return this.http.patch<OrderDetails>(`${this.baseUrl}/carts/${id}`, {"content": string});
  }

  deleteCart(id: string): Observable<Cart> {
    return this.http.delete<Cart>(`${this.baseUrl}/carts/${id}`);
  }

}
