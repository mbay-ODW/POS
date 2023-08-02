import { Component, EventEmitter, Output, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OrdersService } from '../../services/orders.service';
import { SnackbarService } from '../../services/snackbar.service'
@Component({
  selector: 'app-order-delete',
  templateUrl: './order-delete.component.html',
  styleUrls: ['./order-delete.component.less']
})
export class OrderDeleteComponent {
  confirmMessage: string = '';
  @Input() orderId: string = '';




  constructor(
    public activeModal: NgbActiveModal,
    private ordersService: OrdersService, 
    private snackBar: SnackbarService
    ) {}

    confirm(orderId: string) {
      this.ordersService.deleteOrder(this.orderId).subscribe(
      () => {
        this.ordersService.orderDeleted.emit(true);
        this.snackBar.info('Order deleted successfully');
        this.activeModal.close('confirm');
      },
      (error: any) => {
        this.ordersService.orderDeleted.emit(false);
        this.activeModal.close('confirm');
        console.error('Error deleting order', error);
        this.snackBar.error('Order deletion failed:' + JSON.stringify(error));

      }
    );
  }
  
    cancel() {
      this.activeModal.dismiss('cancel');
    }

}
