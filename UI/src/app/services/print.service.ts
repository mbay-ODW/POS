import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Order, OrderDetails } from '../interfaces/order';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrintService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }


printOrder(order: any, id: string): Observable<HttpResponse<Order>>{
return this.http.post<Order>(`${this.baseUrl}/print/orders/${id}`,order,{observe: 'response'});
}

}
