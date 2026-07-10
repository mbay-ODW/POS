import { Component, OnInit, OnDestroy } from '@angular/core';
import { Station } from '../interfaces/station';
import { Order } from '../interfaces/order';
import { StationsService } from '../services/stations.service';
import { OrdersService } from '../services/orders.service';
import { WebsocketService } from '../services/websocket.service';
import { AppSettingsService } from '../services/app-settings.service';
import { interval, Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';

const PREVIEW_STATION_KEY = 'pos_preview_station';

interface AggregatedItem {
  name: string;
  amount: number;
}

@Component({
    selector: 'app-preview',
    templateUrl: './preview.component.html',
    styleUrl: './preview.component.css',
    standalone: false
})
export class PreviewComponent implements OnInit, OnDestroy {
  stations: Station[] = [];
  selectedStation: Station | null = null;
  aggregatedItems: AggregatedItem[] = [];
  lastUpdated: Date | null = null;
  isConfiguring = true;

  private pollSub?: Subscription;
  private wsSub?: Subscription;

  constructor(
    private stationService: StationsService,
    private orderService: OrdersService,
    private ws: WebsocketService,
    private appSettings: AppSettingsService,
  ) {}

  ngOnInit(): void {
    this.stationService.getStations().subscribe(response => {
      this.stations = response.data;
      const savedId = localStorage.getItem(PREVIEW_STATION_KEY);
      if (savedId) {
        const found = this.stations.find(s => s._id === savedId);
        if (found) this.selectStation(found);
      }
    });
  }

  selectStation(station: Station): void {
    this.selectedStation = station;
    localStorage.setItem(PREVIEW_STATION_KEY, station._id!);
    this.isConfiguring = false;
    this.startRealtime();
  }

  showConfig(): void {
    this.isConfiguring = true;
    this.stopRealtime();
  }

  get vorlauf(): number {
    return this.selectedStation?.vorlauf ?? 15;
  }

  private loadOrders(): void {
    this.orderService.getOrdersByStationId(this.selectedStation!._id!, this.vorlauf)
      .subscribe(response => {
        this.aggregate(response.data);
        this.lastUpdated = new Date();
      });
  }

  private startRealtime(): void {
    this.stopRealtime();

    // WebSocket: reload on every new order event (falls verfügbar)
    try {
      this.ws.connect();
      this.wsSub = this.ws.onNewOrder().subscribe(() => this.loadOrders());
    } catch { /* WebSocket optional — Polling reicht */ }

    // Polling als zuverlässiger Fallback (WebSocket läuft auf dem Pi ohne
    // eventlet nicht sauber). Intervall aus den Einstellungen, min. 5s.
    const secs = Math.max(5, Number(this.appSettings.get('preview.refresh_interval')) || 15);
    this.pollSub = interval(secs * 1000).pipe(
      startWith(0),   // sofort beim Öffnen laden
    ).subscribe(() => this.loadOrders());
  }

  private stopRealtime(): void {
    this.pollSub?.unsubscribe();
    this.wsSub?.unsubscribe();
    this.ws.disconnect();
  }

  private aggregate(orders: Order[]): void {
    const map = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.orders) {
        const key = item.product.name;
        map.set(key, (map.get(key) ?? 0) + item.amount);
      }
    }
    this.aggregatedItems = Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }

  ngOnDestroy(): void {
    this.stopRealtime();
  }
}
