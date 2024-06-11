import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../interfaces/category';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {

  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  getCategories(queryParams: string= ''): Observable<{ data: Category[], total: number }> {
    return this.http.get<{ data: Category[], total: number }>(`${this.baseUrl}/categories${queryParams}`);
  }
  
  getCategoryById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/categories/${id}`);
  }

  addCategory(cart: Category): Observable<HttpResponse<Category>> {
    return this.http.post<Category>(`${this.baseUrl}/categories`, cart,{observe: 'response'});
  }

  updateCategory(id: string, cart: Category): Observable<HttpResponse<Category>>{
    return this.http.put<Category>(`${this.baseUrl}/categories/${id}`, cart,{observe: 'response'});
  }

  deleteCategory(id: string): Observable<HttpResponse<Category>> {
    return this.http.delete<Category>(`${this.baseUrl}/categories/${id}`,{observe: 'response'});
  }
}
