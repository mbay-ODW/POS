import { Component, Inject, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Product } from '../../interfaces/product';

@Component({
  selector: 'app-product-view',
  templateUrl: './product-view.component.html',
  styleUrl: './product-view.component.css'
})
export class ProductViewComponent implements OnInit{


  ngOnInit(): void {
  }

  constructor(
    public dialogRef: MatDialogRef<ProductViewComponent>,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: { productItem: Product },  
  ){
  }

  onClose(): void {
    this.dialogRef.close(false);
  }

}
