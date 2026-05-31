import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { AppSettingsService } from '../services/app-settings.service';
import { switchMap, retryWhen, delay, concatMap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

const STATION_KEY   = 'pos_selected_station';
const SORT_KEY      = 'pos_sort_mode';
const ORDER_KEY_PFX = 'pos_product_order_';
const TILE_SIZE_KEY = 'pos_tile_size';
const DISPLAY_KEY   = 'pos_customer_display';

export type SortMode = 'custom' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

const ALL_STATION: Station = { _id: '__all__', name: 'Alle Stationen', categories: [] };

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css'],
  standalone: false,
})
export class BookingComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  cart: OrderDetails[] = [];
  categories: Category[] = [];
  stations: Station[] = [];
  selectedStation: Station | null = null;
  isLoading = false;
  total = 0;

  sortMode: SortMode = 'name-asc';
  dragEnabled = false;
  orderedProducts: Product[] = [];

  controlBarVisible = true;
  tileSize = 140; // px

  // Checkout popup
  showPaymentPopup = false;
  paymentAmount = 0;
  private popupTimer?: ReturnType<typeof setTimeout>;

  // Pause mode
  pauseMode = false;

  constructor(
    private productService: ProductsService,
    private categoryService: CategoriesService,
    private stationService: StationsService,
    private orderService: OrdersService,
    private printerService: PrintService,
    private notificationService: NotificationService,
    private appSettings: AppSettingsService,
  ) {}

  ngOnInit(): void {
    this.sortMode = (localStorage.getItem(SORT_KEY) as SortMode) || 'name-asc';
    this.tileSize = Number(localStorage.getItem(TILE_SIZE_KEY)) || 140;

    this.stationService.getStations().subscribe((r) => {
      this.stations = [ALL_STATION, ...r.data];
      const savedId = localStorage.getItem(STATION_KEY);
      this.selectedStation = this.stations.find(s => s._id === savedId) ?? ALL_STATION;
    });

    this.productService.getProducts('?active=true').subscribe((r) => {
      this.products = r.data;
      this.rebuildOrder();
    });

    this.categoryService.getCategories().subscribe((r) => {
      this.categories = r.data;
    });

    this.broadcastDisplay('active');
  }

  ngOnDestroy(): void {
    clearTimeout(this.popupTimer);
  }

  // ── Display broadcast ────────────────────────────────────────────────────

  private broadcastDisplay(state: 'active' | 'thankyou' | 'pause'): void {
    localStorage.setItem(DISPLAY_KEY, JSON.stringify({
      state,
      cart: this.cart,
      total: this.total,
    }));
    window.dispatchEvent(new StorageEvent('storage', { key: DISPLAY_KEY }));
  }

  // ── Pause mode ───────────────────────────────────────────────────────────

  togglePause(): void {
    this.pauseMode = !this.pauseMode;
    this.broadcastDisplay(this.pauseMode ? 'pause' : 'active');
  }

  // ── Control bar ──────────────────────────────────────────────────────────

  toggleControlBar(): void {
    this.controlBarVisible = !this.controlBarVisible;
  }

  onTileSizeChange(value: number): void {
    this.tileSize = value;
    localStorage.setItem(TILE_SIZE_KEY, String(value));
  }

  // ── Station ──────────────────────────────────────────────────────────────

  onStationChange(station: Station): void {
    this.selectedStation = station;
    localStorage.setItem(STATION_KEY, station._id!);
    this.rebuildOrder();
  }

  get isAllStation(): boolean { return this.selectedStation?._id === '__all__'; }

  get visibleCategories(): Category[] {
    if (this.isAllStation || !this.selectedStation) return [...this.categories].sort((a,b) => a.name.localeCompare(b.name,'de'));
    return this.categories
      .filter(c => this.selectedStation!.categories.includes(c._id!))
      .sort((a,b) => a.name.localeCompare(b.name,'de'));
  }

  // ── Sort & Drag ──────────────────────────────────────────────────────────

  private customOrderKey(): string { return ORDER_KEY_PFX + (this.selectedStation?._id ?? 'all'); }

  private loadCustomOrder(): string[] {
    try { return JSON.parse(localStorage.getItem(this.customOrderKey()) || '[]'); } catch { return []; }
  }

  private saveCustomOrder(): void {
    localStorage.setItem(this.customOrderKey(), JSON.stringify(this.orderedProducts.map(p => p._id)));
  }

  rebuildOrder(): void {
    const base = this.filteredProducts();
    if (this.sortMode === 'custom') {
      const saved = this.loadCustomOrder();
      const map = new Map(base.map(p => [p._id!, p]));
      const ordered = saved.map(id => map.get(id)).filter((p): p is Product => !!p);
      this.orderedProducts = [...ordered, ...base.filter(p => !saved.includes(p._id!))];
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
        case 'name-asc':   return a.name.localeCompare(b.name, 'de');
        case 'name-desc':  return b.name.localeCompare(a.name, 'de');
        case 'price-asc':  return (a.price.current ?? 0) - (b.price.current ?? 0);
        case 'price-desc': return (b.price.current ?? 0) - (a.price.current ?? 0);
        default: return 0;
      }
    });
  }

  onSortChange(mode: SortMode): void {
    this.sortMode = mode;
    localStorage.setItem(SORT_KEY, mode);
    this.dragEnabled = mode === 'custom';
    this.rebuildOrder();
  }

  toggleDrag(): void {
    this.dragEnabled = !this.dragEnabled;
    if (this.dragEnabled && this.sortMode !== 'custom') {
      this.sortMode = 'custom';
      localStorage.setItem(SORT_KEY, 'custom');
    }
  }

  drop(event: CdkDragDrop<Product[]>): void {
    moveItemInArray(this.orderedProducts, event.previousIndex, event.currentIndex);
    this.saveCustomOrder();
  }

  productsForCategory(categoryId: string): Product[] {
    return this.orderedProducts.filter(p => p.category === categoryId);
  }

  // ── Cart ──────────────────────────────────────────────────────────────────

  getBadgeColor(product: Product): 'primary' | 'accent' | 'warn' {
    if (product.stock.current <= product.thresholds.warning) return 'warn';
    if (product.stock.current <= product.thresholds.info) return 'accent';
    return 'primary';
  }

  addToCart(product: Product): void {
    if (this.dragEnabled) return;
    const existing = this.cart.find(i => i.product.id === product._id);
    if (existing) {
      existing.amount += 1;
    } else {
      this.cart.push({
        product: { id: product._id, category: product.category, price: product.price.current, name: product.name, shortName: product.shortName },
        amount: 1,
      });
    }
    this.getTotalPrice();
    this.broadcastDisplay('active');
  }

  removeFromCart(id: String): void {
    this.cart.splice(this.cart.findIndex(i => i.product.id === id), 1);
    this.getTotalPrice();
    this.broadcastDisplay('active');
  }

  increaseAmount(item: OrderDetails): void {
    const e = this.cart.find(i => i.product.id === item.product.id);
    if (e) { e.amount += 1; this.getTotalPrice(); this.broadcastDisplay('active'); }
  }

  decrementItemAmount(item: OrderDetails): void {
    const e = this.cart.find(i => i.product.id === item.product.id);
    if (e) {
      if (e.amount > 1) { e.amount -= 1; this.getTotalPrice(); this.broadcastDisplay('active'); }
      else this.removeFromCart(item.product.id!);
    }
  }

  getTotalAmount(): number { return this.cart.reduce((s, i) => s + i.amount, 0); }

  getTotalPrice(): number {
    this.total = this.cart.reduce((s, i) => s + i.product.price * i.amount, 0);
    return this.total;
  }

  dismissPaymentPopup(): void {
    clearTimeout(this.popupTimer);
    this.showPaymentPopup = false;
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
          const autoPrint = this.appSettings.get('pos.auto_print') === 'true';
          if (autoPrint) {
            this.notificationService.info('Drucke Bestellung');
            return this.printerService.printOrder(order, response.body._id!).pipe(
              retryWhen(errors => errors.pipe(
                concatMap((error, index) => index < 2 ? of(error).pipe(delay(1000)) : throwError(error))
              ))
            );
          }
          return of({ status: 200 } as any);
        }
        throw new Error('Order creation failed');
      })
    ).subscribe(
      () => {
        // Show payment popup
        const popupSecs = Number(this.appSettings.get('pos.checkout_popup_duration')) || 5;
        this.paymentAmount = this.total;
        this.showPaymentPopup = true;
        this.popupTimer = setTimeout(() => this.showPaymentPopup = false, popupSecs * 1000);

        // Broadcast thank-you to customer display
        this.broadcastDisplay('thankyou');

        this.notificationService.info('Bestellung erfolgreich');
        this.reset();
      },
      (error) => console.error('Checkout error:', error)
    );
  }

  reset(): void {
    this.cart = [];
    this.total = 0;
    this.broadcastDisplay('active');
  }
}
