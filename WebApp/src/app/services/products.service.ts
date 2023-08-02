import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

//Import the Product interface
import { Product } from '../models/products';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  productCreated: EventEmitter<boolean> = new EventEmitter<boolean>();
  productEdited: EventEmitter<boolean> = new EventEmitter<boolean>();
  productDeleted: EventEmitter<boolean> = new EventEmitter<boolean>();
  private baseUrl = 'http://localhost:3000/v1';

  constructor(private http: HttpClient) { }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products`);
  }
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/products/${id}`);
  }
  addProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/products`, product);
  }
  updateProduct(id: string, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/products/${id}`, product);
  }
  deleteProduct(id: string): Observable<Product> {
    return this.http.delete<Product>(`${this.baseUrl}/products/${id}`);
  }
  
}
