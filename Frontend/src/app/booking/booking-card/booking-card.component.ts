import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Product } from '../../models/products';
import { CartService } from '../../services/cart.service';
import { faArrowTrendUp } from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'app-booking-card',
  templateUrl: './booking-card.component.html',
  styleUrls: ['./booking-card.component.less']
})
export class BookingCardComponent implements OnInit{
  @Input() products: Product[] = [];
  @Input() product!: Product;
  @Output() stockBadgeClass: string = '';
  faArrowTrendUp = faArrowTrendUp;



  constructor(
    private cartService: CartService
  ){

  }
  
  ngOnInit(): void {
      // Define the stockBadgeClass property
// Inside the ngOnInit or whenever the product changes, update the stockBadgeClass value based on the conditions
if (this.product) {
  const stock = this.product?.stock?.current;
  const warningThreshold = this.product.thresholds.warning;
  const infoThreshold = this.product.thresholds.info;
  
  if (stock >= infoThreshold) {
    this.stockBadgeClass = 'btn btn-success';
  } else if (stock < infoThreshold && stock > warningThreshold){
    this.stockBadgeClass = 'btn btn-warning';
  } else if (stock > 0 && stock < warningThreshold) {
    this.stockBadgeClass = 'btn btn-danger';
  } else {
    this.stockBadgeClass = 'btn btn-dark';
  }


  
}


  }

  addToCart(product: Product){
    this.cartService.addToCart(product);
  };

}
