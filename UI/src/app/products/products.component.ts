import { Component, Input, OnInit } from '@angular/core';
import { ProductsService } from '../services/products.service'; // Adjust the path accordingly
import { Product } from '../interfaces/product'; // Adjust the path accordingly
import { MatDialog } from '@angular/material/dialog';
import { DeleteComponent } from '../dialogs/delete/delete.component';
import { NotificationService } from '../services/notification.service';
import { ProductEditComponent } from './product-edit/product-edit.component';
import { MatDialogConfig } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ProductViewComponent } from './product-view/product-view.component';
import { CategoriesService } from '../services/categories.service';
import { Category } from '../interfaces/category';


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  @Input() layoutMode: 'edit' | 'shopping' = 'edit'; // Default to 'edit'
  products: Product[] = [];
  categories: Category[] = [];
  isLoading: boolean = false;
  totalProducts = 0; // Total number of products
  pageSize = 25; // Default page size
  currentPage = 0; // Current page index

  constructor(
    private productService: ProductsService,
    public matDialog:MatDialog,
    private notification:NotificationService,
    private categoryService: CategoriesService
    ) { }

  ngOnInit(): void {
    this.getProducts();
    this.getCategories();
  }




  getProducts(){
    this.isLoading = true; // Start loading
    this.productService.getProducts().subscribe(response => {
      this.products = response.data;
      this.totalProducts = response.total;
      this.isLoading = false; // Stop loading
    });
  }

  getCategories(){
    this.isLoading = true; // Start loading
    this.categoryService.getCategories().subscribe(response => {
      this.categories = response.data;
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
    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = false;
    dialogConfig.data = { product: product, categories: this.categories };
    dialogConfig.width = "60%";
    dialogConfig.maxWidth = '100%';
    dialogConfig.height= "95%";
  
    const dialogRef = this.matDialog.open(ProductEditComponent, dialogConfig);
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true; // Start loading
        if (id) {
          // Update existing product
          this.productService.updateProduct(id, result).subscribe(
            () => {
              this.getProducts();
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
              this.getProducts();
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

  viewProduct(id: string): void{
    this.productService.getProductById(id).subscribe(productItem => {
      this.openViewDialog(productItem);
    });
  }

  openViewDialog(productItem?: Product) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = false;
    dialogConfig.data = { productItem: productItem };
    dialogConfig.width = "60%";
    dialogConfig.maxWidth = '100%';
    dialogConfig.height= "95%";
    const dialogRef = this.matDialog.open(ProductViewComponent, dialogConfig);
    dialogRef.afterClosed();
  }
  
  

  deleteProduct(id: string): void {
    const type = "product";
    const dialogRef = this.matDialog.open(DeleteComponent,{data: {type}});
    
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true; // Start loading
        this.productService.deleteProduct(id).subscribe(
          () => {
            this.getProducts();
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
