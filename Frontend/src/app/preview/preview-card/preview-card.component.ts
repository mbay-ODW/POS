import { Component, OnInit, Input, Output, EventEmitter }from '@angular/core';
import { Product } from '../../models/products';
import { Order } from '../../models/orders';
import { OrdersService } from '../../services/orders.service';

@Component({
  selector: 'app-preview-card',
  templateUrl: './preview-card.component.html',
  styleUrls: ['./preview-card.component.less']
})
export class PreviewCardComponent  implements OnInit{
  @Input() products: Product[] = [];
  @Input() order!: Order;


  constructor(
    private OrdersSerivce: OrdersService,
  ){

  }
  
  
  ngOnInit(): void {
  }





}
