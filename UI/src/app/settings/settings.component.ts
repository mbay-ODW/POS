import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Setting } from '../interfaces/setting';
import { SettingsService } from '../services/settings.service';
import { AppSettingsService } from '../services/app-settings.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { NotificationService } from '../services/notification.service';
import { SettingEditComponent } from './setting-edit/setting-edit.component';
import { SettingViewComponent } from './setting-view/setting-view.component';
import { DeleteComponent } from '../dialogs/delete/delete.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface TabConfig {
  prefix: string;
  keys: string[];
  defaults: Record<string, any>;
}

const TABS: Record<string, TabConfig> = {
  system: {
    prefix: 'system',
    keys: ['system.logo', 'system.name', 'system.currency'],
    defaults: { logo: '', name: 'POS System', currency: '€' },
  },
  bon: {
    prefix: 'bon',
    keys: ['bon.name', 'bon.address', 'bon.footer', 'bon.paper_width', 'bon.show_prices', 'bon.copies', 'bon.logo'],
    defaults: { name: '', address: '', footer: 'Danke für Ihren Besuch!', paper_width: '58', show_prices: false, copies: 1, logo: '' },
  },
  pos: {
    prefix: 'pos',
    keys: ['pos.auto_print', 'pos.require_station'],
    defaults: { auto_print: true, require_station: true },
  },
  preview: {
    prefix: 'preview',
    keys: ['preview.refresh_interval', 'preview.default_vorlauf'],
    defaults: { refresh_interval: 60, default_vorlauf: 15 },
  },
};

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  standalone: false
})
export class SettingsComponent implements OnInit {
  displayedColumns = ['name', 'description', 'value', 'actions'];
  dataSource = new MatTableDataSource<Setting>();
  isLoading = false;

  forms: Record<string, FormGroup> = {};
  tabLoading: Record<string, boolean> = {};
  tabSaving: Record<string, boolean> = {};
  settingIds: Record<string, Record<string, string>> = {};

  systemLogoPreview: string | null = null;
  bonLogoPreview: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;

  constructor(
    private settingsService: SettingsService,
    private appSettings: AppSettingsService,
    private dialog: MatDialog,
    private notification: NotificationService,
    private fb: FormBuilder,
  ) {
    this.forms['system'] = this.fb.group({ logo: [''], name: [''], currency: [''] });
    this.forms['bon'] = this.fb.group({ logo: [''], name: [''], address: [''], footer: [''], paper_width: ['58'], show_prices: [false], copies: [1] });
    this.forms['pos'] = this.fb.group({ auto_print: [true], require_station: [true] });
    this.forms['preview'] = this.fb.group({ refresh_interval: [60], default_vorlauf: [15] });
  }

  ngOnInit(): void {
    this.loadAllSettings();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  // ── Load all settings once, distribute to tabs ───────────────────────────

  loadAllSettings(): void {
    Object.keys(TABS).forEach(t => this.tabLoading[t] = true);
    this.isLoading = true;

    this.settingsService.getSettings().subscribe({
      next: (response) => {
        const all: Setting[] = response.data;
        this.dataSource.data = all;
        this.isLoading = false;

        for (const [tab, config] of Object.entries(TABS)) {
          this.settingIds[tab] = {};
          const patch: Record<string, any> = { ...config.defaults };

          for (const key of config.keys) {
            const shortKey = key.split('.')[1];
            const found = all.find(s => s.name === key);
            if (found) {
              this.settingIds[tab][key] = found._id!;
              if (typeof config.defaults[shortKey] === 'boolean') {
                patch[shortKey] = found.value === 'true';
              } else if (typeof config.defaults[shortKey] === 'number') {
                patch[shortKey] = Number(found.value) || config.defaults[shortKey];
              } else {
                patch[shortKey] = found.value;
              }
              // logo previews
              if (key === 'system.logo') this.systemLogoPreview = found.value || null;
              if (key === 'bon.logo') this.bonLogoPreview = found.value || null;
            }
          }
          this.forms[tab].patchValue(patch);
          this.tabLoading[tab] = false;
        }
      },
      error: () => {
        Object.keys(TABS).forEach(t => this.tabLoading[t] = false);
        this.isLoading = false;
      },
    });
  }

  // ── Save a tab ────────────────────────────────────────────────────────────

  save(tab: string): void {
    this.tabSaving[tab] = true;
    const config = TABS[tab];
    const val = this.forms[tab].value;

    const saves$ = config.keys.map(key => {
      const shortKey = key.split('.')[1];
      let value = val[shortKey];
      if (typeof value === 'boolean') value = value ? 'true' : 'false';
      const payload: Setting = { name: key, description: key, value: String(value ?? '') };
      const existingId = this.settingIds[tab]?.[key];
      return (existingId
        ? this.settingsService.updateSetting(existingId, payload)
        : this.settingsService.addSetting(payload)
      ).pipe(catchError(() => of(null)));
    });

    forkJoin(saves$).subscribe({
      next: () => {
        this.tabSaving[tab] = false;
        this.notification.info('Gespeichert');
        this.appSettings.load();
        this.loadAllSettings();
      },
      error: () => { this.tabSaving[tab] = false; this.notification.error('Fehler beim Speichern'); },
    });
  }

  // ── Logo helpers ──────────────────────────────────────────────────────────

  onLogoSelected(event: Event, tab: 'system' | 'bon'): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      if (tab === 'system') this.systemLogoPreview = b64;
      else this.bonLogoPreview = b64;
      this.forms[tab].patchValue({ logo: b64 });
    };
    reader.readAsDataURL(file);
  }

  removeLogo(tab: 'system' | 'bon'): void {
    if (tab === 'system') this.systemLogoPreview = null;
    else this.bonLogoPreview = null;
    this.forms[tab].patchValue({ logo: '' });
  }

  // ── Generic Settings tab ─────────────────────────────────────────────────

  refresh(): void { this.loadAllSettings(); }

  editSetting(id?: string): void {
    const load$ = id ? this.settingsService.getSettingById(id) : of(undefined as any);
    load$.subscribe(item => this.openDialog(item, id));
  }

  openDialog(setting?: Setting, id?: string): void {
    const ref = this.dialog.open(SettingEditComponent, {
      disableClose: true, autoFocus: true, width: '60%', maxWidth: '100%', height: '95%',
      data: { settingItem: setting },
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const call = id
        ? this.settingsService.updateSetting(id, result)
        : this.settingsService.addSetting(result);
      call.subscribe({
        next: () => { this.notification.info('Gespeichert'); this.loadAllSettings(); },
        error: (e) => this.notification.error(e.error?.message || 'Fehler'),
      });
    });
  }

  viewSetting(id: string): void {
    this.settingsService.getSettingById(id).subscribe(item => {
      this.dialog.open(SettingViewComponent, {
        data: { settingItem: item }, width: '60%', maxWidth: '100%', height: '95%',
      });
    });
  }

  deleteSetting(id: string): void {
    const ref = this.dialog.open(DeleteComponent, { data: { type: 'diese Einstellung' } });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.settingsService.deleteSetting(id).subscribe({
        next: () => { this.notification.info('Gelöscht'); this.loadAllSettings(); },
        error: (e) => this.notification.error(e.error?.message || 'Fehler'),
      });
    });
  }
}
