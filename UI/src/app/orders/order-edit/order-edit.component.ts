import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Order, OrderDetails } from '../../interfaces/order';
import { NotificationService } from '../../services/notification.service';
import { Product } from '../../interfaces/product';

@Component({
    selector: 'app-order-edit',
    templateUrl: './order-edit.component.html',
    styleUrls: ['./order-edit.component.css'],
    standalone: false
})
export class OrderEditComponent implements OnInit {
  form: FormGroup;
  products: Product[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<OrderEditComponent>,
    private notification: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: { orderItem: Order, products: Product[] }
  ) {
    this.products = data.products;

    this.form = this.fb.group({
      orders: this.fb.array(data.orderItem && data.orderItem.orders ? this.initOrders(data.orderItem.orders) : []),
      total: [data.orderItem ? data.orderItem.total : 0, Validators.required]
    });
  }

  ngOnInit(): void {}

  private initOrders(orderDetails: OrderDetails[]): FormGroup[] {
    return orderDetails.map(orderDetail => this.fb.group({
      product: this.fb.group({
        id: [orderDetail.product.id, Validators.required],
        category: [orderDetail.product.category, Validators.required],
        name: [orderDetail.product.name, Validators.required],
        price: [orderDetail.product.price, Validators.required],
      }),
      amount: [orderDetail.amount, Validators.required],
    }));
  }

  get OrderFormArray(): FormArray {
    return this.form.get('orders') as FormArray;
  }

  addOrderDetails(): void {
    const newOrder = this.fb.group({
      product: this.fb.group({
        id: ['', Validators.required],
        category: [''],
        name: [''],
        price: [0],
      }),
      amount: [0],
    });
    this.OrderFormArray.push(newOrder);
  }

  removeOrderDetails(index: number): void {
    this.OrderFormArray.removeAt(index);
  }

  onProductSelect(event: any, index: number): void {
  const selectedProductId = event.value;
  const selectedProduct = this.products.find(product => product._id === selectedProductId);
  if (selectedProduct) {
    const orderDetailFormGroup = this.OrderFormArray.at(index).get('product') as FormGroup;
    if (orderDetailFormGroup) {
      orderDetailFormGroup.patchValue({
        id: selectedProduct._id,
        category: selectedProduct.category,
        name: selectedProduct.name,
        price: selectedProduct.price.current,
      });
    }
  }
}

  getTotalPrice(): number {
    return this.OrderFormArray.controls.reduce((sum, control) => {
      const orderDetail = control.value;
      return sum + (orderDetail.product.price * orderDetail.amount);
    }, 0);
  }

  onSave(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      const totalPrice = this.getTotalPrice(); // Calculate total price

      const order: Order = {
        orders: formValue.orders.map((orderDetail: any) => {
          const product = this.products.find(p => p._id === orderDetail.product.id);
          if (!product) {
            throw new Error(`Product with id ${orderDetail.product.id} not found`);
          }
          return {
            product: {
              id: product._id,
              category: product.category,
              name: product.name,
              price: product.price.current,
            },
            amount: orderDetail.amount,
          };
        }),
        total: totalPrice, // Set the total price
      };
      this.dialogRef.close(order);
    } else {
      this.notification.error("Feld ungültig.");
    }
  }

  onCancel(): void {
    this.form.reset();
    this.dialogRef.close(false);
  }
}