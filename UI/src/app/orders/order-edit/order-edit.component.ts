import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { OrdersService } from '../../services/orders.service';
import { Observable } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Order, OrderDetails } from '../../interfaces/order';
import { NotificationService } from '../../services/notification.service';
import { ProductsService } from '../../services/products.service';
import { Product } from '../../interfaces/product';



@Component({
  selector: 'app-order-edit',
  templateUrl: './order-edit.component.html',
  styleUrls: ['./order-edit.component.css']
})
export class OrderEditComponent implements OnInit {
  products: Product[] = [];
  form: FormGroup;
  order: Order[] = [];
  editingOrder: Order | null = null;


  constructor(
    private fb: FormBuilder,
    private ordersService: OrdersService,
    public dialogRef: MatDialogRef<OrderEditComponent>,
    private   notification: NotificationService,
    private productsService: ProductsService,
    @Inject(MAT_DIALOG_DATA) public data: { order: Order },


    ) {
      this.form = this.fb.group({
        creationTime: '', // Add this control
        orders: this.fb.array([])
      });
  }


  orderDetails() {
    return this.form.get('orders') as FormArray;
  }

  addOrderDetails(orderDetail?: OrderDetails): void {
    const indexNumber = this.orderDetails().length + 1; // Get the current length of the order details array and add 1
    if (orderDetail) {
      // Existing order detail
      this.orderDetails().push(this.fb.group({
        id: indexNumber.toString(),
        product: this.fb.group({
          id: orderDetail.product._id,
          name: orderDetail.product.name
        }),
        amount: orderDetail.amount
      }));
    } else {
      // New order detail
      this.orderDetails().push(this.fb.group({
        id: indexNumber.toString(), // Use the index number + 1 as the ID
        product: this.fb.group({
          id: '',
          name: ''
        }),
        amount: 0
      }));
    }
  }
  
  

// Remove an OrderDetails at the specified index
removeOrderDetails(index: number): void {
  this.orderDetails().removeAt(index);
}

ngOnInit(): void {
  this.productsService.getProducts().subscribe(response => {
    this.products = response.data;
  });

  this.form.patchValue({
    creationTime: this.data.order.creationTime,
  });

  this.editingOrder = this.data.order;
  if (this.editingOrder?.orders) {
    this.editingOrder.orders.forEach(orderDetail => this.addOrderDetails(orderDetail));
  }
}



  onSave(): void {
    if (this.form.valid) {
      const order: Order = this.form.value;

      this.dialogRef.close(order);
    } else {
      // Handle form validation error
    }
  }

  onCancel(): void {
    // If you want to navigate away from the form, you can inject Router and navigate
    // this.router.navigate(['/some-path']);
  
    // If you want to reset the form to its initial state
    this.form.reset();
    this.dialogRef.close(false);
  }

  onProductSelected(event: Event, index: number): void {
    const selectedProductId = (event.target as HTMLSelectElement).value;
    const selectedProduct = this.products.find(product => product._id === selectedProductId);
    if (selectedProduct) {
      this.orderDetails().at(index).get('product.id')?.setValue(selectedProductId);
      this.orderDetails().at(index).get('product.name')?.setValue(selectedProduct.name);
    }
  }  
  

}
