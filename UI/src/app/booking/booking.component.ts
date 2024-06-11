import { Component, OnInit, ViewChild } from '@angular/core';
import { Product } from '../interfaces/product';
import { ProductsService } from '../services/products.service';
import { CategoriesService } from '../services/categories.service';
import { Category } from '../interfaces/category';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Order, OrderDetails } from '../interfaces/order';
import { Validators } from '@angular/forms';
import {MatListModule} from '@angular/material/list';
import { OrdersService } from '../services/orders.service';
import { PrintService } from '../services/print.service';
import { HttpResponse } from '@angular/common/http';
import { NotificationService } from '../services/notification.service';
import { switchMap, retryWhen, delay, take, concatMap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';


@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit{
  products: Product[] = [];
  cart: OrderDetails [] = [];
  
  categories: Category[] = [];
  isLoading: boolean = false;
  dataSource!: MatTableDataSource<Product>;
  total: number = 0;
  private cartIdCounter: number = 1;

  constructor(private productService: ProductsService,
              private categoryService: CategoriesService,
              private orderService: OrdersService,
              private printerService: PrintService,
              private notificationService: NotificationService,
      ) 
      {
        this.dataSource = new MatTableDataSource();
      }

  ngOnInit(): void {
    this.productService.getProducts().subscribe((response) => {
      this.products = response.data;
    });
    this.categoryService.getCategories().subscribe((response) => {
      this.categories = response.data;
    })
  }

  getCategoryNameById(id: string): string{
    let name= this.categories.find(categoryItem => categoryItem._id === id);
    return name? name.name: 'Unbekannt';
  }


  getBadgeColor(product: Product): 'primary' | 'accent' | 'warn' {
    if (product.stock.current <= product.thresholds.warning) {
      return 'warn';
    } else if (product.stock.current <= product.thresholds.info) {
      return 'accent';
    } else {
      return 'primary';
    }
  }

  addToCart(product: Product): void {

    const newCartItem = {
      product: {"id": product._id, "category": product.category, "price":  product.price.current , "name": product.name } ,
      amount: 1,
    };

    const existingProduct = this.cart.find(item => item.product.id === product._id);
    if (existingProduct) {
      existingProduct.amount += 1;
    } else {
      this.cart.push(newCartItem);
    }
  }

  removeFromCart(id: String): void {
    const index = this.cart.findIndex(item => item.product.id === id);
    if (index > -1) {
      this.cart.splice(index, 1);
    }
  }

  increaseAmount(cartItem: OrderDetails): void {
    const existingProduct = this.cart.find(item => item.product.id === cartItem.product.id);
    if (existingProduct) {
      existingProduct.amount += 1;

    }
  }

  decrementItemAmount(cartItem: OrderDetails): void {
    const existingProduct = this.cart.find(item => item.product.id === cartItem.product.id);
    if (existingProduct) {
      if (existingProduct.amount > 1) {
        existingProduct.amount -= 1;
      } else {
        this.removeFromCart(cartItem.product.id!);
      }
    }
  }

  getTotalAmount(): number{
    return this.cart.reduce((sum, item) => sum + item.amount, 0);
  }

  getOrderItem(): number{
    return 0;
  }

  getTotalPrice(): number{
    
    this.total = this.cart.reduce((sum, item) => sum + (item.product.price * item.amount), 0);
    return this.total
  }
  checkout(): void {
    const order: Order = {
      orders: this.cart,
      total: this.total,
    };
  
    this.orderService.addOrder(order).pipe(
      switchMap((response: HttpResponse<Order>) => {
        if (response.status === 201 && response.body) {
          console.log(response.body);
          this.notificationService.info("Drucke Bestellung");
          return this.printerService.printOrder(order, response.body._id!).pipe(
            retryWhen(errors =>
              errors.pipe(
                concatMap((error, index) => {
                  if (index < 2) {
                    // Retry up to 2 more times
                    return of(error).pipe(delay(1000)); // Delay between retries
                  } else {
                    // After 3 attempts, throw the error
                    return throwError(error);
                  }
                })
              )
            )
          );
        } else {
          throw new Error('Order creation failed');
        }
      })
    ).subscribe(
      (printResponse: HttpResponse<any>) => {
        if (printResponse.status === 200) {
          this.notificationService.info('Bestellung erfolgreich gedruckt');
          this.reset();
        } else {
          throw new Error('Printing failed');
        }
      },
      (error) => {
        console.error('An error occurred during checkout:', error);
      }
    );
  }


  reset(): void{
    this.cart = [];
    this.total = 0;
  }


}
