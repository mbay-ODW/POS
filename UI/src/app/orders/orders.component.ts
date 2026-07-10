import { Component, OnInit } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { Order } from '../interfaces/order';
import { OrdersService } from '../services/orders.service';
import { NotificationService } from '../services/notification.service';
import { MatDialog } from '@angular/material/dialog';
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
export class OrdersComponent implements OnInit {
  displayedColumns: string[] = ['orderDetails', 'total', 'creationTime', 'actions'];
  orders: Order[] = [];
  products: Product[] = [];
  isLoading = false;

  // Server-side pagination + sorting state
  totalOrders = 0;
  totalRevenue = 0;
  pageIndex = 0;
  pageSize = 25;
  sortBy = 'creationTime';
  sortDir = -1; // -1 = absteigend, 1 = aufsteigend

  constructor(
    private orderService: OrdersService,
    private productService: ProductsService,
    private printService: PrintService,
    private dialog: MatDialog,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    this.getProducts();
    this.loadPage();
  }

  loadPage(): void {
    this.isLoading = true;
    const skip = this.pageIndex * this.pageSize;
    const q = `?skip=${skip}&pageSize=${this.pageSize}&sortBy=${this.sortBy}&sortDir=${this.sortDir}`;
    this.orderService.getOrders(q).subscribe({
      next: (response: any) => {
        this.orders = response.data;
        this.totalOrders = response.total ?? response.data.length;
        this.totalRevenue = response.totalRevenue ?? 0;
        this.isLoading = false;
      },
      error: () => {
        this.notification.error('Fehler beim Laden der Bestellungen');
        this.isLoading = false;
      }
    });
  }

  onSort(sort: Sort): void {
    if (!sort.direction) { this.sortBy = 'creationTime'; this.sortDir = -1; }
    else { this.sortBy = sort.active; this.sortDir = sort.direction === 'asc' ? 1 : -1; }
    this.pageIndex = 0;
    this.loadPage();
  }

  onPage(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.loadPage();
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

  refresh(): void { this.loadPage(); }

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
        next: () => { this.notification.info(id ? 'Aktualisiert' : 'Erstellt'); this.loadPage(); this.isLoading = false; },
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
        next: () => { this.notification.info('Bestellung gelöscht'); this.loadPage(); },
        error: (e) => this.notification.error(e.error?.message || 'Fehler'),
      });
    });
  }
}
