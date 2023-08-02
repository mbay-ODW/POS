import { Component, OnInit } from '@angular/core';
import { Product } from '../models/products';
import { Order } from '../models/orders';
import { ProductsService } from '../services/products.service';
import { CartService } from '../services/cart.service'; 
import { OrdersService } from '../services/orders.service';
import { interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.less']
})
export class PreviewComponent implements OnInit{
  products: Product[] = [];
  product: any;
  orders: Order[] = [];
  order: any;


  constructor(
    private productsService: ProductsService,
    private ordersService: OrdersService, 
  ){
  }


  ngOnInit(): void {
    this.getOrders();
    this.ordersService.orderEdited.subscribe((isEdited: Boolean) => {
      if (isEdited){
        this.getOrders();
      }
    });
    this.ordersService.orderDeleted.subscribe((isEdited: Boolean) => {
      if (isEdited){
        this.getOrders();
      }
    });
  }

  getOrders(): void {
    this.ordersService.getOrders().subscribe((orders: Order[]) => {
      this.orders = orders;
    });
  }

}
