import { Component, OnInit, inject } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { Product } from '../models/products';
import { Order } from '../models/orders';
import { ProductsService } from '../services/products.service';
import { CartService } from '../services/cart.service';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { OrdersService } from '../services/orders.service';


@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css']
})
export class BookingsComponent implements OnInit{
  products: Product[] = [];
  orders: Order[] = [];
  product: any;
  order: any;
  searchFilter: string = '';


  constructor(
    private productsService: ProductsService,
    private cartService: CartService,
    private ordersService: OrdersService,
  ){
  
  }

  ngOnInit(): void {
    this.productsService.getProducts().subscribe((products: Product[]) => {
      this.products = products;
    });
  }


 
  private breakpointObserver = inject(BreakpointObserver);

  cols = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return 1;
      } else if (window.innerWidth < 1000) {
        return 2;
      } else if (window.innerWidth < 1500) {
        return 3;
      }
      return 4;
    })
  );
}
