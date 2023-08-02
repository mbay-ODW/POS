import { Component, OnInit } from '@angular/core';
import { Product } from '../models/products';
import { ProductsService } from '../services/products.service';
import { CartService } from '../services/cart.service';



@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.less']
})
export class BookingComponent implements OnInit{
  products: Product[] = [];
  product: any;
  searchFilter: string = '';


constructor(
  private productsService: ProductsService,
  private cartService: CartService
){

}


  ngOnInit(): void {
    this.getProducts();  }


    getProducts(): void {
      this.productsService.getProducts().subscribe((products: Product[]) => {
        this.products = products;
      });
    }
  

  get filteredProducts() {
    if (!this.searchFilter) {
      return this.products;
    }
    
    const filtered = this.products.filter(product => product.name.toLowerCase().includes(this.searchFilter.toLowerCase()));
    console.log('Filtered products:', filtered);
    return filtered;  }
  
    resetFilter(){
      this.searchFilter = '';
    }

}
