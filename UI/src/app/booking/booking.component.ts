import { Component, OnInit } from '@angular/core';
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

const STATION_KEY = 'pos_selected_station';

@Component({
    selector: 'app-booking',
    templateUrl: './booking.component.html',
    styleUrls: ['./booking.component.css'],
    standalone: false
})
export class BookingComponent implements OnInit {
  products: Product[] = [];
  cart: OrderDetails[] = [];
  categories: Category[] = [];
  stations: Station[] = [];
  selectedStation: Station | null = null;
  isLoading = false;
  total = 0;

  constructor(
    private productService: ProductsService,
    private categoryService: CategoriesService,
    private stationService: StationsService,
    private orderService: OrdersService,
    private printerService: PrintService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.stationService.getStations().subscribe((response) => {
      this.stations = response.data;
      const savedId = localStorage.getItem(STATION_KEY);
      if (savedId) {
        const found = this.stations.find(s => s._id === savedId);
        if (found) this.onStationChange(found);
      }
    });

    this.productService.getProducts('?active=true').subscribe((response) => {
      this.products = response.data;
    });

    this.categoryService.getCategories().subscribe((response) => {
      this.categories = response.data;
    });
  }

  onStationChange(station: Station): void {
    this.selectedStation = station;
    localStorage.setItem(STATION_KEY, station._id!);
  }

  get visibleCategories(): Category[] {
    const list = this.selectedStation
      ? this.categories.filter(c => this.selectedStation!.categories.includes(c._id!))
      : this.categories;
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }

  get visibleProducts(): Product[] {
    const list = this.selectedStation
      ? this.products.filter(p => this.selectedStation!.categories.includes(p.category))
      : this.products;
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }

  getCategoryNameById(id: string): string {
    const found = this.categories.find(c => c._id === id);
    return found ? found.name : 'Unbekannt';
  }

  getBadgeColor(product: Product): 'primary' | 'accent' | 'warn' {
    if (product.stock.current <= product.thresholds.warning) return 'warn';
    if (product.stock.current <= product.thresholds.info) return 'accent';
    return 'primary';
  }

  addToCart(product: Product): void {
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

  checkout(): void {
    const order: Order = {
      orders: this.cart,
      total: this.total,
      station_id: this.selectedStation?._id,
    };

    this.orderService.addOrder(order).pipe(
      switchMap((response: HttpResponse<Order>) => {
        if (response.status === 201 && response.body) {
          this.notificationService.info('Drucke Bestellung');
          return this.printerService.printOrder(order, response.body._id!).pipe(
            retryWhen(errors =>
              errors.pipe(
                concatMap((error, index) => index < 2 ? of(error).pipe(delay(1000)) : throwError(error))
              )
            )
          );
        }
        throw new Error('Order creation failed');
      })
    ).subscribe(
      (printResponse: HttpResponse<any>) => {
        if (printResponse.status === 200) {
          this.notificationService.info('Bestellung erfolgreich gedruckt');
          this.reset();
        } else {
          throw new Error('Printing failed');
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
