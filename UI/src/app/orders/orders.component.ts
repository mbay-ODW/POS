import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Order } from '../interfaces/order';
import { OrdersService } from '../services/orders.service';
import { NotificationService } from '../services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DeleteComponent } from '../dialogs/delete/delete.component';
import { MatDialogConfig } from '@angular/material/dialog';
import { OrderEditComponent } from './order-edit/order-edit.component';



@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})

export class OrdersComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;
  orders = new MatTableDataSource<Order>();
  isLoading: boolean = false;
  totalProducts = 0; // Total number of products
  pageSize = 25; // Default page size
  currentPage = 0; // Current page index
  dataSource: MatTableDataSource<Order> | undefined;
  displayedColumns: string[] = ['orderId', 'orderDetails' ,'creationTime', 'actions'];


  constructor(
    private ordersService: OrdersService,
    public matDialog:MatDialog,
    private notification:NotificationService,
    ) { }

  ngOnInit(): void {
    this.getOrders(this.currentPage, this.pageSize);

  }

  ngAfterViewInit(): void {
    this.orders.sort = this.sort;
  }


  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getOrders(this.currentPage, this.pageSize);
  }


  getOrders(page: number, pageSize: number) {
    this.isLoading = true; // Start loading
    this.ordersService.getOrders(page, pageSize).subscribe(response => {
      this.orders.data = response.data; // <-- Set the data without overwriting the whole MatTableDataSource instance
      this.totalProducts = response.total;
      this.isLoading = false; // Stop loading
    });
  }


  deleteOrder(id: string): void {
    const type = "order";
    const dialogRef = this.matDialog.open(DeleteComponent,{data: {type}});
    
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true; // Start loading
        this.ordersService.deleteOrder(id).subscribe(
          () => {
            this.getOrders(this.currentPage, this.pageSize);
            this.notification.info("Successfully deleted")
            this.isLoading = false; // Stop loading
          },
          error => {
            this.notification.error("Error in deletion: " + error.message)
            this.isLoading = false; // Stop loading
          }
        );
      }
    });

}

editOrder(id?: string): void {
  if (id) {
    this.ordersService.getOrderById(id).subscribe(order => {
      this.openDialog(order, id);
    });
  } else {
    // Thats the case for creating a new product
    this.openDialog();
  }
}

openDialog(order?: any, id?: string): void {
  const dialogConfig = new MatDialogConfig();
  dialogConfig.data = { order: order };
  dialogConfig.maxWidth = '80vw'; // 80% of viewport width
  dialogConfig.maxHeight = '80vh'; // 80% of viewport height
  dialogConfig.minHeight = '45vw'; // 45% of viewport width
  dialogConfig.minWidth = '50vh'; // 50% of viewport height

  const dialogRef = this.matDialog.open(OrderEditComponent, dialogConfig);
  
  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.isLoading = true; // Start loading
      if (id) {
        // Update existing product
        this.ordersService.updateOrder(id, result).subscribe(
          () => {
            this.getOrders(this.currentPage, this.pageSize);
            this.notification.info("Successfully updated");
            this.isLoading = false; // Stop loading
          },
          error => {
            this.notification.error("Error in update: " + error);
            this.isLoading = false; // Stop loading
          }
        );
      } else {
        // Add new product
        this.ordersService.addOrder(result).subscribe(
          () => {
            this.getOrders(this.currentPage, this.pageSize);
            this.notification.info("Successfully added");
            this.isLoading = false; // Stop loading
          },
          error => {
            this.notification.error("Error in add: " + error);
            this.isLoading = false; // Stop loading
          }
        );
      }
    }
  });
}


}