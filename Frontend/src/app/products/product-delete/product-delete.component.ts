import { Component, EventEmitter, Output, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductsService } from '../../services/products.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-product-delete',
  templateUrl: './product-delete.component.html',
  styleUrls: ['./product-delete.component.less']
})
export class ProductDeleteComponent {
  confirmMessage: string = '';
  @Input() productId: string = '';



  constructor(
    public activeModal: NgbActiveModal,
    private productsService: ProductsService,
    private snackBar: SnackbarService, 
    
    ) {}

  confirm(productId: string) {
    this.productsService.deleteProduct(this.productId).subscribe(
    () => {
      this.productsService.productDeleted.emit(true);
      this.activeModal.close('confirm');
      this.snackBar.info('Product deleted successfully');
    },
    (error: any) => {
      this.productsService.productDeleted.emit(false);
      this.activeModal.close('confirm');
      console.error('Error deleting product', error);
      this.snackBar.error('Product deletion failed:' + JSON.stringify(error));

    }
  );
}

  cancel() {
    this.activeModal.dismiss('cancel');
  }
}
