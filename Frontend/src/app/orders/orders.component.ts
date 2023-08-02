import { Component, OnInit } from '@angular/core';
import { OrdersService } from '../services/orders.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Order, OrderDetails } from '../models/orders';
import { OrderPrintComponent } from './order-print/order-print.component';
import { OrderDeleteComponent } from './order-delete/order-delete.component';
import { OrderEditComponent } from './order-edit/order-edit.component';
import { ProductsService } from '../services/products.service';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { map } from 'rxjs/operators';
import { combineLatest, Observable } from 'rxjs';
import { Product } from '../models/products';


@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.less']
})
export class OrdersComponent implements OnInit{
    orders: Order[] = [];
    order: any;
    searchFilter: string = '';
    faPen = faPen;
    faTrashCan = faTrashCan;
    faPrint = faPrint;
    faPlus = faPlus;
    sortType: string = 'creationTime'; // default sort type
    sortReverse: boolean = false; // default sort order
    totalAmountSum: number = 0;


    constructor(
      private ordersService: OrdersService,
      private modalService: NgbModal,
      private productsService: ProductsService,
      )
    {

    }

  ngOnInit(): void { 
    this.getOrders()
  }

  getOrders(): void {
    this.ordersService.getOrders().subscribe((orders: Order[]) => {
      this.orders = orders;
    });
  }

  openEditModal(order: Order) {
    const modalRef = this.modalService.open(OrderEditComponent);
    modalRef.componentInstance.orderId = order?._id;
    this.ordersService.orderEdited.subscribe((isEdited: Boolean) => {
      if (isEdited){
        this.getOrders();
      }
    });
  }

  openCreateModal() {
    const modalRef = this.modalService.open(OrderEditComponent);
    modalRef.componentInstance.orderId = null;
    this.ordersService.orderCreated.subscribe((isCreated: Boolean) => {
      if (isCreated){
        this.getOrders();
      }
    });
  }

  openDeleteModal(order: Order) {
    const modalRef = this.modalService.open(OrderDeleteComponent);
    modalRef.componentInstance.confirmMessage = 'Are you sure you want to delete this product?';
    modalRef.componentInstance.orderId = order._id;
    this.ordersService.orderDeleted.subscribe((isDeleted: Boolean) => {
      if (isDeleted){
        this.getOrders();
      }
    });
  }

  openPrintModal(order: Order) {
    const modalRef = this.modalService.open(OrderPrintComponent);
    modalRef.componentInstance.confirmMessage = 'Are you sure you want to print this order?';
    modalRef.componentInstance.productId = order._id;
    modalRef.componentInstance.deleted.subscribe((isPrinted: boolean) => {
      if (isPrinted) {
        // Handle successful printing
        this.getOrders();
      } else {
        // Handle print failure
      }
    });
  }

  get filteredOrders() {
    let sortedOrders = [...this.orders]; // clone the array so the original does not get sorted
    sortedOrders.sort((a, b) => {
      const aValue = a[this.sortType];
      const bValue = b[this.sortType];
  
      // Check if the values are numbers or strings, because they require different sorting methods
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return this.sortReverse ? bValue - aValue : aValue - bValue; // for numeric
      } else {
        return this.sortReverse
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue); // for strings
      }
    });
  
    // filter code
    if (!this.searchFilter) {
      return sortedOrders;
    }
  
    return sortedOrders.filter(order => 
      order.orders.some(detail => detail.product?.name?.includes(this.searchFilter))
      );
  }


  onSort(sortType: string) {
    this.sortType = sortType;
    this.sortReverse = !this.sortReverse;
  }

  resetFilter(){
    this.searchFilter = '';
  }

   // Method to fetch product details based on the product ID
   getProductDetails(productId: string): Observable<Product> {
    return this.productsService.getProductById(productId);
  }

  // Method to calculate the total amount for an order
  calculateTotalAmount(orders: OrderDetails[]): Observable<number> {
    const amountObservables: Observable<number>[] = [];
    orders.forEach(detail => {
      const productDetail$ = this.getProductDetails(detail.product.id);
      const amount$ = productDetail$.pipe(
        map((product: Product) => product.price.current * detail.amount)
      );
      amountObservables.push(amount$);
    });

    // Combine the observables using combineLatest
    return combineLatest(amountObservables).pipe(
      map(amounts => amounts.reduce((total, amount) => total + amount, 0))
    );
  }

  calculateTotalAmountSum(): void {
    const orderDetailsArray: OrderDetails[] = this.orders.flatMap(order => order.orders);
    
    this.calculateTotalAmount(orderDetailsArray).subscribe(totalAmount => {
      this.totalAmountSum = totalAmount; // Set the totalAmountSum with the received value
    });
  }


}
