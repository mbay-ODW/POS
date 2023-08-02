// in the file src/app/cart/cart.component.ts

import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CartService } from '../services/cart.service';
import { Product } from '../models/products';
import { PrintService } from '../services/print.service';
import { OrdersService } from '../services/orders.service';
import { Order, OrderDetails, OrderProduct } from '../models/orders';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { SnackbarService } from '../services/snackbar.service';



@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.less']
})
export class CartComponent implements OnInit {
  cart: Record<string, Product[]> = {};
  totalPrice: number = 0;
  faShoppingCart = faShoppingCart;
  faTrashCan= faTrashCan;


  constructor(
    private cartService: CartService,
    private ordersService: OrdersService,
    private printService: PrintService,
    private snackBar: SnackbarService, 
    ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(cart => {
      this.cart = this.groupByProductId(cart);
      this.calculateTotalPrice();
        });
  }

  groupByProductId(products: Product[]): Record<string, Product[]> {
    const grouped: Record<string, Product[]> = {};
    for (let product of products) {
      if (!grouped[product._id]) {
        grouped[product._id] = [];
      }
      grouped[product._id].push(product);
    }
    return grouped;
  }

  removeFromCart(product: Product) {
    this.cartService.removeFromCart(product);
  }


  calculateTotalPrice() {
    this.totalPrice = 0;
    for (let productId in this.cart) {
        this.totalPrice += this.cart[productId].length * this.cart[productId][0].price.current;
    }
  }




  checkout() {
    // Define the orders array
    let orders: OrderDetails[] = [];
    let index = 1; // This will serve as your id for OrderDetails
  
   // Loop through each product in the cart
for (let productId in this.cart) {
  // Get the cart product
  const cartProduct = this.cart[productId][0];

  // Create a new product object for the OrderDetails
  let orderProduct: OrderProduct = {
    id: productId, // Use the productId here
    name: cartProduct.name
  };

  // Create an OrderDetails object for the product
  let orderDetail: OrderDetails = {
    id: index.toString(), // Or generate an id for the order detail
    product: orderProduct,
    amount: this.cart[productId].length
  };

  // Add the OrderDetails object to the orders array
  orders.push(orderDetail);
  index++; // increment the index for next iteration
}

  
    // Create the order object
    const order: Order = {
      orders: orders
    };
    
    console.log(order)
    // Add the order
    this.ordersService.addOrder(order).subscribe((response) => {
      // Print the label
      console.log(response)
      console.log(response['id'])
      this.printService.printById(response['id']).subscribe((response) => {
        console.log("test")
      });
  
      // Clear the cart
      this.ordersService.orderCreated.emit(true);
      this.snackBar.info("Order placed Successfully!");
      this.cartService.clearCart();
    });
  }
  
  


}
