import { Component, OnInit } from '@angular/core';
import { ProductsService } from '../services/products.service'; // Adjust the path accordingly
import { Product } from '../interfaces/product'; // Adjust the path accordingly
import { MatDialog } from '@angular/material/dialog';
import { DeleteComponent } from '../dialogs/delete/delete.component';
import  { NotificationService } from '../services/notification.service';
import { ProductEditComponent } from './product-edit/product-edit.component';
import { MatDialogConfig } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  isLoading: boolean = false;
  totalProducts = 0; // Total number of products
  pageSize = 25; // Default page size
  currentPage = 0; // Current page index

  constructor(
    private productService: ProductsService,
    public matDialog:MatDialog,
    private notification:NotificationService,
    ) { }

  ngOnInit(): void {
    this.getProducts(this.currentPage, this.pageSize);

  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getProducts(this.currentPage, this.pageSize);
  }




  getProducts(page: number, pageSize: number){
    this.isLoading = true; // Start loading
    this.productService.getProducts(page, pageSize).subscribe(response => {
      this.products = response.data;
      this.totalProducts = response.total;
      this.isLoading = false; // Stop loading
    });
  }
  

  editProduct(id?: string): void {
    if (id) {
      this.productService.getProductById(id).subscribe(product => {
        this.openDialog(product, id);
      });
    } else {
      // Thats the case for creating a new product
      this.openDialog();
    }
  }
  
  openDialog(product?: any, id?: string): void {
    const dialogConfig = new MatDialogConfig();
    const categories = this.products.map(p => p.category);
    dialogConfig.data = { product: product, categories: categories };
    dialogConfig.maxWidth = '80vw'; // 80% of viewport width
    dialogConfig.maxHeight = '80vh'; // 80% of viewport height
    dialogConfig.minHeight = '45vw'; // 45% of viewport width
    dialogConfig.minWidth = '50vh'; // 50% of viewport height
  
    const dialogRef = this.matDialog.open(ProductEditComponent, dialogConfig);
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true; // Start loading
        if (id) {
          // Update existing product
          this.productService.updateProduct(id, result).subscribe(
            () => {
              this.getProducts(this.currentPage, this.pageSize);
              this.notification.info("Successfully updated");
              this.isLoading = false; // Stop loading
            },
            error => {
              this.notification.error("Error in update: " + error);
              this.isLoading = false; // Stop loading
            }
          );
        } else {
          // Add new product
          this.productService.addProduct(result).subscribe(
            () => {
              this.getProducts(this.currentPage, this.pageSize);
              this.notification.info("Successfully added");
              this.isLoading = false; // Stop loading
            },
            error => {
              this.notification.error("Error in add: " + error);
              this.isLoading = false; // Stop loading
            }
          );
        }
      }
    });
  }
  
  

  deleteProduct(id: string): void {
    const type = "product";
    const dialogRef = this.matDialog.open(DeleteComponent,{data: {type}});
    
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true; // Start loading
        this.productService.deleteProduct(id).subscribe(
          () => {
            this.getProducts(this.currentPage, this.pageSize);
            this.notification.info("Successfully deleted")
            this.isLoading = false; // Stop loading
          },
          error => {
            this.notification.error("Error in deletion: " + error.message)
            this.isLoading = false; // Stop loading
          }
        );
      }
    });

}


getBadgeColor(product: Product): 'primary' | 'accent' | 'warn' {
  if (product.stock.current <= product.thresholds.warning) {
    return 'warn';
  } else if (product.stock.current <= product.thresholds.info) {
    return 'accent';
  } else {
    return 'primary';
  }
}





}
