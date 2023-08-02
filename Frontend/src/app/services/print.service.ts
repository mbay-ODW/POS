import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Order } from '../models/orders';

@Injectable({
  providedIn: 'root'
})
export class PrintService {
  private baseUrl = 'http://localhost:3000/v1';


  constructor(private http: HttpClient) { }


  printById(id: string): Observable<Order>{
    return this.http.post<Order>(`${this.baseUrl}/print/${id}`, id);
  }
}
