import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Setting } from '../interfaces/setting';
import { SettingsService } from '../services/settings.service';
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

const BON_KEYS = ['bon.name', 'bon.address', 'bon.footer', 'bon.paper_width', 'bon.show_prices', 'bon.copies', 'bon.logo'];
const BON_DEFAULTS: Record<string, string> = {
  'bon.name': '',
  'bon.address': '',
  'bon.footer': 'Danke für Ihren Besuch!',
  'bon.paper_width': '58',
  'bon.show_prices': 'false',
  'bon.copies': '1',
  'bon.logo': '',
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

  // Bon settings
  bonForm: FormGroup;
  bonLoading = false;
  bonSaving = false;
  bonLogoPreview: string | null = null;
  private bonSettingIds: Record<string, string> = {};

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;

  constructor(
    private settingsService: SettingsService,
    private dialog: MatDialog,
    private notification: NotificationService,
    private fb: FormBuilder,
  ) {
    this.bonForm = this.fb.group({
      name: [''],
      address: [''],
      footer: [''],
      paper_width: ['58'],
      show_prices: [false],
      copies: [1],
      logo: [''],
    });
  }

  ngOnInit(): void {
    this.getSettings();
    this.loadBonSettings();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  // ── Bon Settings ─────────────────────────────────────────────

  loadBonSettings(): void {
    this.bonLoading = true;
    this.settingsService.getSettings().subscribe({
      next: (response) => {
        const all: Setting[] = response.data;
        const patch: Record<string, any> = {};
        for (const key of BON_KEYS) {
          const shortKey = key.split('.')[1];
          const found = all.find(s => s.name === key);
          if (found) {
            this.bonSettingIds[key] = found._id!;
            if (key === 'bon.show_prices') patch[shortKey] = found.value === 'true';
            else if (key === 'bon.copies') patch[shortKey] = Number(found.value) || 1;
            else if (key === 'bon.logo') { patch[shortKey] = found.value; this.bonLogoPreview = found.value || null; }
            else patch[shortKey] = found.value;
          } else {
            if (key === 'bon.show_prices') patch[shortKey] = false;
            else if (key === 'bon.copies') patch[shortKey] = 1;
            else patch[shortKey] = BON_DEFAULTS[key] || '';
          }
        }
        this.bonForm.patchValue(patch);
        this.bonLoading = false;
      },
      error: () => this.bonLoading = false,
    });
  }

  saveBon(): void {
    this.bonSaving = true;
    const val = this.bonForm.value;
    const saves$ = BON_KEYS.map(key => {
      const shortKey = key.split('.')[1];
      let value = val[shortKey];
      if (key === 'bon.show_prices') value = value ? 'true' : 'false';
      if (key === 'bon.copies') value = String(value);
      const payload: Setting = { name: key, description: key, value: String(value ?? '') };
      const existingId = this.bonSettingIds[key];
      if (existingId) {
        return this.settingsService.updateSetting(existingId, payload).pipe(catchError(() => of(null)));
      } else {
        return this.settingsService.addSetting(payload).pipe(catchError(() => of(null)));
      }
    });
    forkJoin(saves$).subscribe({
      next: () => { this.bonSaving = false; this.notification.info('Bon-Einstellungen gespeichert'); this.loadBonSettings(); },
      error: () => { this.bonSaving = false; this.notification.error('Fehler beim Speichern'); },
    });
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      this.bonLogoPreview = b64;
      this.bonForm.patchValue({ logo: b64 });
    };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.bonLogoPreview = null;
    this.bonForm.patchValue({ logo: '' });
  }

  // ── Generic Settings ─────────────────────────────────────────

  getSettings(): void {
    this.isLoading = true;
    this.settingsService.getSettings().subscribe({
      next: (r) => { this.dataSource.data = r.data; this.isLoading = false; },
      error: () => { this.notification.error('Fehler beim Laden'); this.isLoading = false; },
    });
  }

  refresh(): void { this.getSettings(); }

  editSetting(id?: string): void {
    if (id) {
      this.settingsService.getSettingById(id).subscribe(item => this.openDialog(item, id));
    } else {
      this.openDialog();
    }
  }

  openDialog(setting?: Setting, id?: string): void {
    const ref = this.dialog.open(SettingEditComponent, {
      disableClose: true, autoFocus: true, width: '60%', maxWidth: '100%', height: '95%',
      data: { settingItem: setting },
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.isLoading = true;
      const call = id
        ? this.settingsService.updateSetting(id, result)
        : this.settingsService.addSetting(result);
      call.subscribe({
        next: () => { this.notification.info('Gespeichert'); this.getSettings(); this.isLoading = false; },
        error: (e) => { this.notification.error(e.error?.message || 'Fehler'); this.isLoading = false; },
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
        next: () => { this.notification.info('Gelöscht'); this.getSettings(); },
        error: (e) => this.notification.error(e.error?.message || 'Fehler'),
      });
    });
  }
}
