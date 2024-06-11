import { Component, OnInit, ViewChild } from '@angular/core';
import { Setting } from '../interfaces/setting';
import { SettingsService } from '../services/settings.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { NotificationService } from '../services/notification.service';
import { SettingEditComponent } from './setting-edit/setting-edit.component'; // Ensure this component is created for editing settings
import { SettingViewComponent } from './setting-view/setting-view.component';
import { DeleteComponent } from '../dialogs/delete/delete.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  displayedColumns: string[] = ['name', 'description', 'value', 'actions'];
  dataSource = new MatTableDataSource<Setting>();
  isLoading: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;

  constructor(
    private settingsService: SettingsService,
    private dialog: MatDialog,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.getSettings();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  getSettings(): void {
    this.isLoading = true;
    this.settingsService.getSettings().subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to get settings', error);
        this.notification.error('Error getting settings');
        this.isLoading = false;
      }
    });
  }

  editSetting(id?: string): void {
    if (id) {
      this.settingsService.getSettingById(id).subscribe(settingItem => {
        this.openDialog(settingItem, id);
      });
    } else {
      // That's the case for creating a new note
      this.openDialog();
    }
  }

  openDialog(setting?: Setting, id?: string): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = "60%";
    dialogConfig.maxWidth = '100%';
    dialogConfig.height = "95%";
    dialogConfig.data = { settingItem:setting };

    const dialogRef = this.dialog.open(SettingEditComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        if (id) {
          this.settingsService.updateSetting(id, result).subscribe(
            (response) => {
              if (response.status === 200 || response.status === 201){
              // Update was done
              this.notification.info("Erfolgreich bearbeitet")
              }
              else{
              this.notification.info('Fehler mit Code: ' + response.status + ", Text: " + response.statusText);
              console.error(response)
              }
              this.isLoading = false;
              this.getSettings()
            },
            error => {
              // No update
              this.notification.error(error.error.message)
              console.error(error)
              this.isLoading = false;
            }
          )
        } else {
          // Add a new setting
          this.settingsService.addSetting(result).subscribe(
            (response) => {
              if (response.status === 200 || response.status === 201){
              this.notification.info("Erfolgreich bearbeitet")
              this.isLoading = false;
              }
              else{
                this.notification.info('Fehler mit Code: ' + response.status + ", Text: " + response.statusText);
                console.error(response)
              }
              this.isLoading = false;
              this.getSettings();
            },
            error => {
              this.notification.error(error.error.message)
              console.error(error)
              this.isLoading = false;
            }
          )
        }
      }
    });
  }

  viewSetting(id: string): void {
    this.settingsService.getSettingById(id).subscribe(settingItem => {
      this.openViewDialog(settingItem);
    });
  }

  openViewDialog(settingItem?: Setting) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = false;
    dialogConfig.data = { settingItem: settingItem };
    dialogConfig.width = "60%";
    dialogConfig.maxWidth = '100%';
    dialogConfig.height = "95%";
    const dialogRef = this.dialog.open(SettingViewComponent, dialogConfig);
    dialogRef.afterClosed();
  }

  refresh(): void{
      this.getSettings()
  }


  deleteSetting(id: string): void {
    const type = "diese Einstellung";
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;
    dialogConfig.data = { type };
    const dialogRef = this.dialog.open(DeleteComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.settingsService.deleteSetting(id).subscribe(
          (response) => {
            if (response.status === 204) {
            this.notification.info("Einstellung erfolgreich gelöscht.")
            }
            else{
              this.notification.info('Fehler mit Code: ' + response.status + ", Text: " + response.statusText);
              console.error(response) 
            }
            this.isLoading = false;
            this.getSettings();
          },
          error => {
            this.notification.error(error.error.message)
            console.error(error)
          }
        )
      }
    })
  }
}
