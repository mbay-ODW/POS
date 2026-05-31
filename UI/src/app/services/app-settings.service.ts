import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SettingsService } from './settings.service';

export interface AppSettings {
  'system.logo': string;
  'system.name': string;
  'system.currency': string;
  'bon.name': string;
  'bon.address': string;
  'bon.footer': string;
  'bon.paper_width': string;
  'bon.show_prices': string;
  'bon.copies': string;
  'bon.logo': string;
  'pos.auto_print': string;
  'pos.require_station': string;
  'pos.checkout_popup_duration': string;
  'preview.refresh_interval': string;
  'preview.default_vorlauf': string;
  'display.thank_you_message': string;
  'display.thank_you_duration': string;
  'display.pause_message': string;
}

export const SETTING_DEFAULTS: AppSettings = {
  'system.logo': '',
  'system.name': 'POS System',
  'system.currency': '€',
  'bon.name': '',
  'bon.address': '',
  'bon.footer': 'Danke für Ihren Besuch!',
  'bon.paper_width': '58',
  'bon.show_prices': 'false',
  'bon.copies': '1',
  'bon.logo': '',
  'pos.auto_print': 'true',
  'pos.require_station': 'true',
  'pos.checkout_popup_duration': '5',
  'preview.refresh_interval': '60',
  'preview.default_vorlauf': '15',
  'display.thank_you_message': 'Vielen Dank für Ihre Bestellung!',
  'display.thank_you_duration': '8',
  'display.pause_message': 'Wir sind gleich für Sie da.',
};

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  private _settings = new BehaviorSubject<AppSettings>({ ...SETTING_DEFAULTS });
  settings$ = this._settings.asObservable();

  constructor(private settingsService: SettingsService) {}

  load(): void {
    this.settingsService.getSettings().subscribe({
      next: (response) => {
        const merged: AppSettings = { ...SETTING_DEFAULTS };
        for (const s of response.data) {
          if (s.name in merged) {
            (merged as any)[s.name] = s.value;
          }
        }
        this._settings.next(merged);
      },
      error: () => { /* keep defaults */ }
    });
  }

  get(key: keyof AppSettings): string {
    return this._settings.value[key] ?? SETTING_DEFAULTS[key];
  }

  get current(): AppSettings {
    return this._settings.value;
  }
}
