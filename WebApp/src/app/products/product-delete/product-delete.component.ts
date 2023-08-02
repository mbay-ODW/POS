import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProductsService } from '../../services/products.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-product-delete',
  templateUrl: './product-delete.component.html',
  styleUrls: ['./product-delete.component.less']
})
export class ProductDeleteComponent {
  confirmMessage: string = 'Are you sure you want to delete this product?';

  constructor(
    public dialogRef: MatDialogRef<ProductDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {productId: string},
    private productsService: ProductsService,
    private snackBar: SnackbarService, 
  ) {}

  confirm() {
    this.productsService.deleteProduct(this.data.productId).subscribe(
      () => {
        this.dialogRef.close(true);
        this.snackBar.info('Product deleted successfully');
      },
      (error: any) => {
        this.dialogRef.close(false);
        console.error('Error deleting product', error);
        this.snackBar.error('Product deletion failed:' + JSON.stringify(error));
      }
    );
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
