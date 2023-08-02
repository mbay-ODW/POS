import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PrintService } from '../../services/print.service';

@Component({
  selector: 'app-order-print',
  templateUrl: './order-print.component.html',
  styleUrls: ['./order-print.component.less']
})
export class OrderPrintComponent {
  confirmMessage: string = '';
  @Input() orderId!: string;
  @Output() printed: EventEmitter<boolean> = new EventEmitter<boolean>();


  constructor(
    public activeModal: NgbActiveModal,
    private printService: PrintService,
  )
  {}

  confirm(orderId: string) {
    this.printService.printById(this.orderId).subscribe(
    () => {
      this.printed.emit(true);
      this.activeModal.close('confirm');
    },
    (error: any) => {
      this.printed.emit(false);
      this.activeModal.close('confirm');
      console.error('Error printing order', error);
      // Handle error scenario
    }
  );
}

  cancel() {
    this.activeModal.dismiss('cancel');
  }


}
