import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

//Import the Product interface
import { Product } from '../interfaces/product';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private baseUrl = 'http://localhost:3000/v1';

  constructor(private http: HttpClient) { }


  getProducts(page: number, pageSize: number): Observable<{ data: Product[], total: number }> {
    let params = new HttpParams();

    if (page != null && pageSize != null) {
      const start = page * pageSize;
      params = params.set('start', start.toString());
      params = params.set('pageSize', pageSize.toString());
    }

    return this.http.get<{ data: Product[], total: number }>(`${this.baseUrl}/products`, { params });
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
