import { Component, OnInit } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { Product } from '../models/products';
import { ProductsService } from '../services/products.service';
import { ProductEditComponent } from '../products/product-edit/product-edit.component';
import { ProductDeleteComponent } from '../products/product-delete/product-delete.component';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  /** Based on the screen size, switch from standard to one column per row */
  cols = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return 1;
      } else if (window.innerWidth < 1000) {
        return 2;
      } else if (window.innerWidth < 1500) {
        return 3;
      }
      return 4;
    })
  );

  constructor(
    private breakpointObserver: BreakpointObserver, 
    private productsService: ProductsService,
    private dialog: MatDialog,
    ) { }

  ngOnInit() {
    this.productsService.getProducts().subscribe(products => {
      this.products = products;
    });
  }

  openEditModal(product: Product): void {
    const dialogRef = this.dialog.open(ProductEditComponent, {
      width: '800px',
      data: { product: product }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      // Here you can handle what to do after dialog is closed.
    });
  }

  openDeleteModal(product: Product) {
    const dialogRef = this.dialog.open(ProductDeleteComponent, {
      data: { productId: product._id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Product deleted successfully');
      } else {
        console.error('Error deleting product');
      }
    });
  }
}
