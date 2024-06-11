import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Category } from 'src/app/interfaces/category';
import { CategoriesService } from 'src/app/services/categories.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-category-edit',
  templateUrl: './category-edit.component.html',
  styleUrl: './category-edit.component.css'
})
export class CategoryEditComponent {

  form: FormGroup;
  categories: Category[] = [];
  

  ngOnInit(): void {
  }

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CategoryEditComponent>,
    private categoryService: CategoriesService,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: { categoryItem: Category },
  ){
    this.form = this.fb.group({
      name: [data.categoryItem && data.categoryItem.name ? data.categoryItem.name : '' , Validators.required], 
    });
   }

   onCancel(): void {
    this.form.reset();
    this.dialogRef.close(false);
  }

  onSave(): void {
    if (this.form.valid){
      const categoryItem: Category = this.form.value;
      this.dialogRef.close(categoryItem);
    }else {
      this.notificationService.error("Das Formular ist nicht richtig ausgefüllt.")
      console.error('Form is invalid');
    }
  }

}