import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Order } from '../../models/orders';
import { OrdersService } from '../../services/orders.service';
import { FormGroup, FormBuilder, FormControl, FormArray, Validators } from '@angular/forms';
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { Product } from 'src/app/models/products';
import { ProductsService } from 'src/app/services/products.service';
import { SnackbarService } from 'src/app/services/snackbar.service'


@Component({
  selector: 'app-order-edit',
  templateUrl: './order-edit.component.html',
  styleUrls: ['./order-edit.component.less']
})
export class OrderEditComponent implements OnInit{
  editForm: FormGroup;
  faFloppyDisk = faFloppyDisk;
  products: Product[] = [];
  @Input() orderId!: string;
  @Input() order!: Order;
  @Input() type!: string;



  constructor(
    public activeModal: NgbActiveModal, 
    private ordersService: OrdersService, 
    private productsService: ProductsService,
    private snackBar: SnackbarService,
    private formBuilder: FormBuilder,
            ) {
              this['editForm'] = this.formBuilder.group({
                orders: this.formBuilder.array([]),
                creationTime: [''],
              });
            
            }

            ngOnInit() {
              this.productsService.getProducts().subscribe(
                (products: Product[]) => {
                  this.products = products;
                },
                (error) => {
                  console.error('Error fetching products', error);
                }
              );
              if (this.orderId){
                this.type = "Edit";
                this.ordersService.getOrderById(this.orderId).subscribe(
                  (order: Order) => {
                    this.order = order;
                    this['editForm'].patchValue(this.order);
            
                    // Create FormGroups for each OrderDetail object and push them to the 'orders' FormArray
                    let ordersFormArray = this.editForm.get('orders') as FormArray;
                    this.order.orders.forEach(orderDetail => {
                      const orderDetailFormGroup = this.formBuilder.group({
                        id: orderDetail.id,
                        product: this.formBuilder.group({
                          id: orderDetail.product.id,
                          name: orderDetail.product.name
                        }),
                        amount: orderDetail.amount
                      });
                      ordersFormArray.push(orderDetailFormGroup);
                      this.setProductName(orderDetailFormGroup);
                    });
                  },
                  (error) => {
                    console.error('Error fetching order', error);
                  }
                
                );
              } else {
                this.type = "Create";
                // Create FormGroups for each OrderDetail object and push them to the 'orders' FormArray
                let ordersFormArray = this.editForm.get('orders') as FormArray;
                this.order.orders.forEach(orderDetail => {
                  const orderDetailFormGroup = this.formBuilder.group({
                    id: orderDetail.id,
                    product: this.formBuilder.group({
                      id: orderDetail.product.id,
                      name: orderDetail.product.name
                    }),
                    amount: orderDetail.amount
                  });
                  ordersFormArray.push(orderDetailFormGroup);
                  this.setProductName(orderDetailFormGroup);
                });
              }
            }
            

            onSubmit() {
              let formValues = this.editForm.value;
              formValues.orders = (this.editForm.get('orders') as FormArray).value;

              if (this.orderId) {
                // Update existing order
                this.ordersService.updateOrder(this.orderId, formValues).subscribe(
                  () => {
                    this.ordersService.orderEdited.emit(true)
                    this.snackBar.info('Order updated successfully');
                    this.activeModal.close('confirm');
                  },
                  (error) => {
                    this.ordersService.orderEdited.emit(false)
                    console.log(error);
                    this.snackBar.error('Order update failed:' + JSON.stringify(error));
                  }
                );
              } else {
                // Create new product
                this.ordersService.addOrder(formValues).subscribe(
                  () => {
                    this.ordersService.orderCreated.emit(true)
                    this.snackBar.info('Order created successfully');
                    this.activeModal.close('confirm');
                  },
                  (error) => {
                    this.ordersService.orderCreated.emit(false)
                    console.log(error);
                    this.snackBar.error('Order creation failed:' + JSON.stringify(error));
                  }
                );
              }
          
            }

            nextOrderDetailId = 1;
            
            addOrderDetail() {
              let ordersFormArray = this.editForm.get('orders') as FormArray;
              ordersFormArray.push(this.formBuilder.group({
                id: [this.nextOrderDetailId++],
                product: this.formBuilder.group({
                  id: [''],
                  name: ['']
                }),
                amount: ['']
              }));
            }

            deleteOrderDetail(index: number) {
              let ordersFormArray = this.editForm.get('orders') as FormArray;
              ordersFormArray.removeAt(index);
            
              // Update the nextOrderDetailId if necessary to keep it in sync with the array size
              if (index < this.nextOrderDetailId) {
                this.nextOrderDetailId--;
              }
            }

            get ordersArray(): FormArray {
              return this.editForm.get('orders') as FormArray;
            }

            setProductName(orderDetailFormGroup: FormGroup) {
              const productId = orderDetailFormGroup.get('product.id')?.value;
              if (productId) {
                this.productsService.getProductById(productId).subscribe(
                  (product: Product) => {
                    orderDetailFormGroup.get('product.name')?.setValue(product.name);
                  },
                  (error) => {
                    console.error('Error fetching product details', error);
                  }
                );
              }
            }
}
