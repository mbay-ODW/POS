import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/products';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cart: Product[] = [];
  private cartSubject = new BehaviorSubject<Product[]>([]);
  cart$ = this.cartSubject.asObservable();

  addToCart(product: Product) {
    this.cart.push(product);
    this.cartSubject.next(this.cart);
  }

  removeFromCart(product: Product) {
    const productIndex = this.cart.findIndex(cartProduct => cartProduct._id === product._id);
  
    if (productIndex >= 0) {
      this.cart.splice(productIndex, 1);
      this.cartSubject.next([...this.cart]);
    }
  }

  clearCart(){
    this.cart = [];  // Clear the local cart array
    this.cartSubject.next(this.cart);
  }

}
