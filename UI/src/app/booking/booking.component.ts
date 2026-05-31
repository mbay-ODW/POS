import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Product } from '../interfaces/product';
import { ProductsService } from '../services/products.service';
import { CategoriesService } from '../services/categories.service';
import { StationsService } from '../services/stations.service';
import { Category } from '../interfaces/category';
import { Station } from '../interfaces/station';
import { Order, OrderDetails } from '../interfaces/order';
import { OrdersService } from '../services/orders.service';
import { PrintService } from '../services/print.service';
import { HttpResponse } from '@angular/common/http';
import { NotificationService } from '../services/notification.service';
import { switchMap, retryWhen, delay, concatMap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

const STATION_KEY   = 'pos_selected_station';
const SORT_KEY      = 'pos_sort_mode';
const ORDER_KEY_PFX = 'pos_product_order_';

export type SortMode = 'custom' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

// Synthetic "Alle Stationen" entry
const ALL_STATION: Station = { _id: '__all__', name: 'Alle Stationen', categories: [] };

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css'],
  standalone: false,
})
export class BookingComponent implements OnInit {
  products: Product[] = [];
  cart: OrderDetails[] = [];
  categories: Category[] = [];
  stations: Station[] = [];
  selectedStation: Station | null = null;
  isLoading = false;
  total = 0;

  sortMode: SortMode = 'name-asc';
  dragEnabled = false;

  /** Products in display order (after sort or drag) */
  orderedProducts: Product[] = [];

  constructor(
    private productService: ProductsService,
    private categoryService: CategoriesService,
    private stationService: StationsService,
    private orderService: OrdersService,
    private printerService: PrintService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.sortMode = (localStorage.getItem(SORT_KEY) as SortMode) || 'name-asc';

    this.stationService.getStations().subscribe((response) => {
      this.stations = [ALL_STATION, ...response.data];
      const savedId = localStorage.getItem(STATION_KEY);
      const found = this.stations.find(s => s._id === savedId) ?? ALL_STATION;
      this.selectedStation = found;
    });

    this.productService.getProducts('?active=true').subscribe((response) => {
      this.products = response.data;
      this.rebuildOrder();
    });

    this.categoryService.getCategories().subscribe((response) => {
      this.categories = response.data;
    });
  }

  // ── Station ──────────────────────────────────────────────────────────────

  onStationChange(station: Station): void {
    this.selectedStation = station;
    localStorage.setItem(STATION_KEY, station._id!);
    this.rebuildOrder();
  }

  get isAllStation(): boolean {
    return this.selectedStation?._id === '__all__';
  }

  get visibleCategories(): Category[] {
    if (this.isAllStation || !this.selectedStation) return [...this.categories].sort((a, b) => a.name.localeCompare(b.name, 'de'));
    return this.categories
      .filter(c => this.selectedStation!.categories.includes(c._id!))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }

  // ── Sort & Order ──────────────────────────────────────────────────────────

  private customOrderKey(): string {
    return ORDER_KEY_PFX + (this.selectedStation?._id ?? 'all');
  }

  private loadCustomOrder(): string[] {
    try { return JSON.parse(localStorage.getItem(this.customOrderKey()) || '[]'); }
    catch { return []; }
  }

  private saveCustomOrder(): void {
    localStorage.setItem(this.customOrderKey(), JSON.stringify(this.orderedProducts.map(p => p._id)));
  }

  rebuildOrder(): void {
    const base = this.filteredProducts();
    if (this.sortMode === 'custom') {
      const saved = this.loadCustomOrder();
      const indexed = new Map(base.map(p => [p._id!, p]));
      const ordered = saved.map(id => indexed.get(id)).filter((p): p is Product => !!p);
      const rest = base.filter(p => !saved.includes(p._id!));
      this.orderedProducts = [...ordered, ...rest];
    } else {
      this.orderedProducts = this.sortProducts(base);
    }
  }

  private filteredProducts(): Product[] {
    if (this.isAllStation || !this.selectedStation) return this.products;
    return this.products.filter(p => this.selectedStation!.categories.includes(p.category));
  }

  private sortProducts(list: Product[]): Product[] {
    return [...list].sort((a, b) => {
      switch (this.sortMode) {
        case 'name-asc':  return a.name.localeCompare(b.name, 'de');
        case 'name-desc': return b.name.localeCompare(a.name, 'de');
        case 'price-asc': return (a.price.current ?? 0) - (b.price.current ?? 0);
        case 'price-desc':return (b.price.current ?? 0) - (a.price.current ?? 0);
        default: return 0;
      }
    });
  }

  onSortChange(mode: SortMode): void {
    this.sortMode = mode;
    localStorage.setItem(SORT_KEY, mode);
    if (mode === 'custom') {
      this.dragEnabled = true;
    } else {
      this.dragEnabled = false;
    }
    this.rebuildOrder();
  }

  toggleDrag(): void {
    this.dragEnabled = !this.dragEnabled;
    if (this.dragEnabled && this.sortMode !== 'custom') {
      this.sortMode = 'custom';
      localStorage.setItem(SORT_KEY, 'custom');
      this.orderedProducts = [...this.orderedProducts]; // keep current visual order
    }
  }

  drop(event: CdkDragDrop<Product[]>): void {
    moveItemInArray(this.orderedProducts, event.previousIndex, event.currentIndex);
    this.saveCustomOrder();
  }

  productsForCategory(categoryId: string): Product[] {
    return this.orderedProducts.filter(p => p.category === categoryId);
  }

  getCategoryNameById(id: string): string {
    return this.categories.find(c => c._id === id)?.name ?? 'Unbekannt';
  }

  // ── Cart ──────────────────────────────────────────────────────────────────

  getBadgeColor(product: Product): 'primary' | 'accent' | 'warn' {
    if (product.stock.current <= product.thresholds.warning) return 'warn';
    if (product.stock.current <= product.thresholds.info) return 'accent';
    return 'primary';
  }

  addToCart(product: Product): void {
    if (this.dragEnabled) return; // don't add to cart while reordering
    const existing = this.cart.find(i => i.product.id === product._id);
    if (existing) {
      existing.amount += 1;
    } else {
      this.cart.push({
        product: { id: product._id, category: product.category, price: product.price.current, name: product.name, shortName: product.shortName },
        amount: 1,
      });
    }
  }

  removeFromCart(id: String): void {
    const index = this.cart.findIndex(i => i.product.id === id);
    if (index > -1) this.cart.splice(index, 1);
  }

  increaseAmount(item: OrderDetails): void {
    const existing = this.cart.find(i => i.product.id === item.product.id);
    if (existing) existing.amount += 1;
  }

  decrementItemAmount(item: OrderDetails): void {
    const existing = this.cart.find(i => i.product.id === item.product.id);
    if (existing) {
      if (existing.amount > 1) existing.amount -= 1;
      else this.removeFromCart(item.product.id!);
    }
  }

  getTotalAmount(): number {
    return this.cart.reduce((sum, i) => sum + i.amount, 0);
  }

  getTotalPrice(): number {
    this.total = this.cart.reduce((sum, i) => sum + i.product.price * i.amount, 0);
    return this.total;
  }

  // ── Checkout ──────────────────────────────────────────────────────────────

  checkout(): void {
    const order: Order = {
      orders: this.cart,
      total: this.total,
      station_id: this.isAllStation ? undefined : this.selectedStation?._id,
    };

    this.orderService.addOrder(order).pipe(
      switchMap((response: HttpResponse<Order>) => {
        if (response.status === 201 && response.body) {
          this.notificationService.info('Drucke Bestellung');
          return this.printerService.printOrder(order, response.body._id!).pipe(
            retryWhen(errors => errors.pipe(
              concatMap((error, index) => index < 2 ? of(error).pipe(delay(1000)) : throwError(error))
            ))
          );
        }
        throw new Error('Order creation failed');
      })
    ).subscribe(
      (printResponse: HttpResponse<any>) => {
        if (printResponse.status === 200) {
          this.notificationService.info('Bestellung erfolgreich gedruckt');
          this.reset();
        }
      },
      (error) => console.error('Checkout error:', error)
    );
  }

  reset(): void {
    this.cart = [];
    this.total = 0;
  }
}
