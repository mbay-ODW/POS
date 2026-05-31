import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { OrderDetails } from '../interfaces/order';
import { AppSettingsService } from '../services/app-settings.service';

const DISPLAY_KEY = 'pos_customer_display';

type DisplayState = 'active' | 'thankyou' | 'pause';

interface DisplayPayload {
  state: DisplayState;
  cart: OrderDetails[];
  total: number;
}

@Component({
  selector: 'app-customer-display',
  templateUrl: './customer-display.component.html',
  styleUrl: './customer-display.component.css',
  standalone: false,
})
export class CustomerDisplayComponent implements OnInit, OnDestroy {
  state: DisplayState = 'active';
  cart: OrderDetails[] = [];
  total = 0;

  thankYouMessage = 'Vielen Dank für Ihre Bestellung!';
  pauseMessage = 'Wir sind gleich für Sie da.';
  logo = '';
  systemName = 'POS';

  private storageHandler = (e: StorageEvent) => {
    if (e.key === DISPLAY_KEY) this.zone.run(() => this.readState());
  };
  private thankYouTimer?: ReturnType<typeof setTimeout>;

  constructor(private appSettings: AppSettingsService, private zone: NgZone) {}

  ngOnInit(): void {
    this.appSettings.load();
    this.appSettings.settings$.subscribe(s => {
      this.thankYouMessage = s['display.thank_you_message'];
      this.pauseMessage = s['display.pause_message'];
      this.logo = s['system.logo'];
      this.systemName = s['system.name'];
    });
    this.readState();
    window.addEventListener('storage', this.storageHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.storageHandler);
    clearTimeout(this.thankYouTimer);
  }

  private readState(): void {
    const raw = localStorage.getItem(DISPLAY_KEY);
    if (!raw) return;
    try {
      const data: DisplayPayload = JSON.parse(raw);
      this.cart = data.cart || [];
      this.total = data.total || 0;

      if (data.state === 'thankyou') {
        this.state = 'thankyou';
        const secs = Number(this.appSettings.get('display.thank_you_duration')) || 8;
        clearTimeout(this.thankYouTimer);
        this.thankYouTimer = setTimeout(() => {
          this.zone.run(() => { this.state = 'active'; this.cart = []; this.total = 0; });
        }, secs * 1000);
      } else {
        this.state = data.state;
      }
    } catch { /* ignore */ }
  }

  getTotalAmount(): number {
    return this.cart.reduce((s, i) => s + i.amount, 0);
  }
}
