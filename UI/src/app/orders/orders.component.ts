import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Order } from '../interfaces/order';
import { OrdersService } from '../services/orders.service';
import { NotificationService } from '../services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DeleteComponent } from '../dialogs/delete/delete.component';
import { MatDialogConfig } from '@angular/material/dialog';
import { OrderEditComponent } from './order-edit/order-edit.component';
import { OrderViewComponent } from './order-view/order-view.component';
import { ProductsService } from '../services/products.service';
import { Product } from '../interfaces/product';



@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})

export class OrdersComponent implements OnInit {
  displayedColumns: string[] = ['orderDetails', 'total','creationTime','actions'];
  dataSource = new MatTableDataSource<Order>();
  isLoading: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;
  orders: Order[] = [];
  products: Product[] = [];

  constructor(
    private orderService: OrdersService,
    private productService: ProductsService,
    private dialog: MatDialog,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.getOrders();
    this.getProducts();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  getOrders(): void {
    this.isLoading = true;
    this.orderService.getOrders().subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to get stations', error);
        this.notification.error('Error getting orders');
        this.isLoading = false;
      }
    });
  }

  getProducts(): void {
    this.isLoading = true;
    let queryParams = '?';
    queryParams = queryParams + 'fields=name,shortName,creationTime,category,price'
    this.productService.getProducts(queryParams).subscribe({
      next: (response) => {
        this.products = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to get stations', error);
        this.notification.error('Error getting orders');
        this.isLoading = false;
      }
    });
  }


  editOrder(id?: string): void {
    if (id) {
      this.orderService.getOrderById(id).subscribe(orderItem => {
        this.openDialog(orderItem, id);
      });
    } else {
      // That's the case for creating a new order
      this.openDialog();
    }
  }

  openDialog(order?: Order, id?: string): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = "60%";
    dialogConfig.maxWidth = '100%';
    dialogConfig.height = "95%";
    dialogConfig.data = { orderItem: order, products: this.products };

    const dialogRef = this.dialog.open(OrderEditComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        if (id) {
          this.orderService.updateOrder(id, result).subscribe(
            (response) => {
              if (response.status === 200 || response.status === 201){
              // Update was done
              this.getOrders();
              this.notification.info("Erfolgreich bearbeitet")
              }
              else{
              this.notification.info('Fehler mit Code: ' + response.status + ", Text: " + response.statusText);
              console.error(response)
              }
              this.isLoading = false;
              this.getOrders()
            },
            error => {
              // No update
              this.notification.error(error.error.message)
              console.error(error)
              this.isLoading = false;
            }
          )
        } else {
          // Add a new station
          this.orderService.addOrder(result).subscribe(
            (response) => {
              if (response.status === 200 || response.status === 201){
              this.getOrders();
              this.notification.info("Erfolgreich erzeugt")
              this.isLoading = false;
              }
              else{
                this.notification.info('Fehler mit Code: ' + response.status + ", Text: " + response.statusText);
                console.error(response)
              }
              this.isLoading = false;
              this.getOrders();
            },
            error => {
              this.notification.error(error.error.message)
              console.error(error)
              this.isLoading = false;
            }
          )
        }
      }
    });
  }

  viewOrder(id: string): void {
    this.orderService.getOrderById(id).subscribe(orderItem => {
      this.openViewDialog(orderItem);
    });
  }

  openViewDialog(orderItem?: Order) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = false;
    dialogConfig.data = { orderItem: orderItem};
    dialogConfig.width = "60%";
    dialogConfig.maxWidth = '100%';
    dialogConfig.height = "95%";
    const dialogRef = this.dialog.open(OrderViewComponent, dialogConfig);
    dialogRef.afterClosed();
  }

  refresh(): void{
      this.getOrders()
  }

  getProductNameById(id: string): string{
    let name= this.products.find(productItem => productItem._id === id);
    return name? name.name: 'Unbekannt';
  }


  deleteOrder(id: string): void {
    const type = "diese Bestellung";
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;
    dialogConfig.data = { type };
    const dialogRef = this.dialog.open(DeleteComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.orderService.deleteOrder(id).subscribe(
          (response) => {
            if (response.status === 204) {
            this.notification.info("Bestellung erfolgreich gelöscht.")
            }
            else{
              this.notification.info('Fehler mit Code: ' + response.status + ", Text: " + response.statusText);
              console.error(response) 
            }
            this.isLoading = false;
            this.getOrders();
          },
          error => {
            this.notification.error(error.error.message)
            console.error(error)
          }
        )
      }
    })
  }
}
