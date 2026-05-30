import { Component, OnInit, ViewChild } from '@angular/core';
import { Category } from '../interfaces/category';
import { CategoriesService } from '../services/categories.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { NotificationService } from '../services/notification.service';
import { CategoryEditComponent } from './category-edit/category-edit.component'; // You need to create this
import { CategoryViewComponent } from './category-view/category-view.component';
import { DeleteComponent } from '../dialogs/delete/delete.component';

@Component({
    selector: 'app-categories',
    templateUrl: './categories.component.html',
    styleUrls: ['./categories.component.css'],
    standalone: false
})
export class CategoriesComponent implements OnInit {
  displayedColumns: string[] = ['name', 'actions'];
  dataSource = new MatTableDataSource<Category>();
  isLoading: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;

  constructor(
    private categoryService: CategoriesService,
    private dialog: MatDialog,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.getCategories();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  getCategories(): void {
    this.isLoading = true;
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to fetch categories', error);
        this.notification.error('Error fetching categories');
        this.isLoading = false;
      }
    });
  }

  editCategory(id?: string): void {
    if (id) {
      this.categoryService.getCategoryById(id).subscribe(categoryItem => {
        this.openDialog(categoryItem, id);
      });
    } else {
      // That's the case for creating a new note
      this.openDialog();
    }
  }

  openDialog(category?: Category, id?: string): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = "60%";
    dialogConfig.maxWidth = '100%';
    dialogConfig.height = "95%";
    dialogConfig.data = { categoryItem:category };

    const dialogRef = this.dialog.open(CategoryEditComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        if (id) {
          this.categoryService.updateCategory(id, result).subscribe(
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
              this.getCategories()
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
          this.categoryService.addCategory(result).subscribe(
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
              this.getCategories();
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

  viewCategory(id: string): void {
    this.categoryService.getCategoryById(id).subscribe(categoryItem => {
      this.openViewDialog(categoryItem);
    });
  }

  openViewDialog(categoryItem?: Category) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = false;
    dialogConfig.data = { categoryItem: categoryItem };
    dialogConfig.width = "60%";
    dialogConfig.maxWidth = '100%';
    dialogConfig.height = "95%";
    const dialogRef = this.dialog.open(CategoryViewComponent, dialogConfig);
    dialogRef.afterClosed();
  }

  refresh(): void{
      this.getCategories()
  }


  deleteCategory(id: string): void {
    const type = "diese Kategorie";
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;
    dialogConfig.data = { type };
    const dialogRef = this.dialog.open(DeleteComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.categoryService.deleteCategory(id).subscribe(
          (response) => {
            if (response.status === 204) {
            this.notification.info("Einstellung erfolgreich gelöscht.")
            }
            else{
              this.notification.info('Fehler mit Code: ' + response.status + ", Text: " + response.statusText);
              console.error(response) 
            }
            this.isLoading = false;
            this.getCategories();
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
