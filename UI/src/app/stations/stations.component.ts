import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Station } from '../interfaces/station';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { StationsService } from '../services/stations.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { NotificationService } from '../services/notification.service';
import { StationEditComponent } from './station-edit/station-edit.component';
import { StationViewComponent } from './station-view/station-view.component';
import { DeleteComponent } from '../dialogs/delete/delete.component';
import { Category } from '../interfaces/category';
import { CategoriesService } from '../services/categories.service';

@Component({
  selector: 'app-stations',
  templateUrl: './stations.component.html',
  styleUrl: './stations.component.css'
})
export class StationsComponent implements OnInit {
  displayedColumns: string[] = ['name', 'categories', 'actions'];
  dataSource = new MatTableDataSource<Station>();
  isLoading: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;
  categories: Category[] = [];

  constructor(
    private stationService: StationsService,
    private dialog: MatDialog,
    private categoryService: CategoriesService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.getCategories();
    this.getStations();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  getStations(): void {
    this.isLoading = true;
    this.stationService.getStations().subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to get stations', error);
        this.notification.error('Error getting stations');
        this.isLoading = false;
      }
    });
  }

  getCategories(): void{
    this.isLoading = true;
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to get stations', error);
        this.notification.error('Error getting stations');
        this.isLoading = false;
      }
    });

  }

  editStation(id?: string): void {
    if (id) {
      this.stationService.getStationById(id).subscribe(stationItem => {
        this.openDialog(stationItem, id);
      });
    } else {
      // That's the case for creating a new note
      this.openDialog();
    }
  }

  openDialog(station?: Station, id?: string): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '500px';
    dialogConfig.data = { stationItem:station, categories: this.categories };

    const dialogRef = this.dialog.open(StationEditComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        if (id) {
          this.stationService.updateStation(id, result).subscribe(
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
              this.getStations()
            },
            error => {
              // No update
              this.notification.error(error.error.message)
              console.error(error)
              this.isLoading = false;
            }
          )
        } else {
          // Add a new station
          this.stationService.addStation(result).subscribe(
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
              this.getStations();
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

  viewStation(id: string): void {
    this.stationService.getStationById(id).subscribe(stationItem => {
      this.openViewDialog(stationItem);
    });
  }

  openViewDialog(stationItem?: Station) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = false;
    dialogConfig.data = { stationItem: stationItem, selectedCategories: this.getCategoryNamesByIds(stationItem?.categories!) };
    dialogConfig.width = "60%";
    dialogConfig.maxWidth = '100%';
    dialogConfig.height = "95%";
    const dialogRef = this.dialog.open(StationViewComponent, dialogConfig);
    dialogRef.afterClosed();
  }

  refresh(): void{
      this.getStations()
  }

  getCategoryNamesByIds(ids: string[]): string[] {
    return ids.map(id => this.categories.find(cat => cat._id === id)?.name || 'Unknown');
}


  deleteStation(id: string): void {
    const type = "diese Station";
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;
    dialogConfig.data = { type };
    const dialogRef = this.dialog.open(DeleteComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.stationService.deleteStation(id).subscribe(
          (response) => {
            if (response.status === 204) {
            this.notification.info("Station erfolgreich gelöscht.")
            }
            else{
              this.notification.info('Fehler mit Code: ' + response.status + ", Text: " + response.statusText);
              console.error(response) 
            }
            this.isLoading = false;
            this.getStations();
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
