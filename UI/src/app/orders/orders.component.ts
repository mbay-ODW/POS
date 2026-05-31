import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Order } from '../interfaces/order';
import { OrdersService } from '../services/orders.service';
import { NotificationService } from '../services/notification.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DeleteComponent } from '../dialogs/delete/delete.component';
import { OrderEditComponent } from './order-edit/order-edit.component';
import { OrderViewComponent } from './order-view/order-view.component';
import { ProductsService } from '../services/products.service';
import { Product } from '../interfaces/product';
import { PrintService } from '../services/print.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
  standalone: false
})
export class OrdersComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['orderDetails', 'total', 'creationTime', 'actions'];
  dataSource = new MatTableDataSource<Order>();
  isLoading = false;
  totalOrders = 0;
  totalRevenue = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;

  orders: Order[] = [];
  products: Product[] = [];

  constructor(
    private orderService: OrdersService,
    private productService: ProductsService,
    private printService: PrintService,
    private dialog: MatDialog,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    this.getOrders();
    this.getProducts();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    // Custom sort for nested date/number fields
    this.dataSource.sortingDataAccessor = (item: Order, prop: string) => {
      switch (prop) {
        case 'creationTime': return item.creationTime ? new Date(item.creationTime).getTime() : 0;
        case 'total': return item.total ?? 0;
        default: return (item as any)[prop];
      }
    };
  }

  getOrders(): void {
    this.isLoading = true;
    this.orderService.getOrders().subscribe({
      next: (response) => {
        this.orders = response.data;
        this.dataSource.data = response.data;
        this.totalOrders = response.data.length;
        this.totalRevenue = response.data.reduce((sum, o) => sum + (o.total ?? 0), 0);
        this.isLoading = false;
      },
      error: () => {
        this.notification.error('Fehler beim Laden der Bestellungen');
        this.isLoading = false;
      }
    });
  }

  getProducts(): void {
    this.productService.getProducts('?fields=name,shortName,creationTime,category,price').subscribe({
      next: (response) => { this.products = response.data; },
      error: () => {}
    });
  }

  getProductNameById(id: string): string {
    const p = this.products.find(p => p._id === id);
    return p ? p.name : 'Unbekannt';
  }

  refresh(): void { this.getOrders(); }

  // ── CRUD ────────────────────────────────────────────────────────

  editOrder(id?: string): void {
    const load$ = id ? this.orderService.getOrderById(id) : null;
    if (load$) {
      load$.subscribe(order => this.openDialog(order, id));
    } else {
      this.openDialog();
    }
  }

  openDialog(order?: Order, id?: string): void {
    const ref = this.dialog.open(OrderEditComponent, {
      disableClose: true, autoFocus: true,
      width: '60%', maxWidth: '100%', height: '95%',
      data: { orderItem: order, products: this.products },
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.isLoading = true;
      const call = id
        ? this.orderService.updateOrder(id, result)
        : this.orderService.addOrder(result);
      call.subscribe({
        next: () => { this.notification.info(id ? 'Aktualisiert' : 'Erstellt'); this.getOrders(); this.isLoading = false; },
        error: (e) => { this.notification.error(e.error?.message || 'Fehler'); this.isLoading = false; },
      });
    });
  }

  viewOrder(id: string): void {
    this.orderService.getOrderById(id).subscribe(order => {
      this.dialog.open(OrderViewComponent, {
        data: { orderItem: order }, width: '60%', maxWidth: '100%', height: '95%',
      });
    });
  }

  printOrder(id: string): void {
    this.printService.printOrder('', id).subscribe({
      next: (r) => {
        if (r.status === 200) this.notification.info('Erfolgreich gedruckt');
        else this.notification.error('Fehler beim Drucken: ' + r.statusText);
      },
      error: () => this.notification.error('Drucker nicht erreichbar'),
    });
  }

  deleteOrder(id: string): void {
    const ref = this.dialog.open(DeleteComponent, { data: { type: 'diese Bestellung' } });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.orderService.deleteOrder(id).subscribe({
        next: () => { this.notification.info('Bestellung gelöscht'); this.getOrders(); },
        error: (e) => this.notification.error(e.error?.message || 'Fehler'),
      });
    });
  }
}
