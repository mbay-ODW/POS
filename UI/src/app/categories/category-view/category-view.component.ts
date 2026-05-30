import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Category } from 'src/app/interfaces/category';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
    selector: 'app-category-view',
    templateUrl: './category-view.component.html',
    styleUrl: './category-view.component.css',
    standalone: false
})
export class CategoryViewComponent {

  ngOnInit(): void {
  }

  constructor(
    public dialogRef: MatDialogRef<CategoryViewComponent>,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: { categoryItem: Category },
  ) {}

  onClose(): void {
    this.dialogRef.close(false);
  }


}
