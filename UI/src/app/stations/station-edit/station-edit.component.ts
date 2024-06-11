import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Category } from 'src/app/interfaces/category';
import { Station } from 'src/app/interfaces/station';
import { NotificationService } from 'src/app/services/notification.service';
import { StationsService } from 'src/app/services/stations.service';

@Component({
  selector: 'app-station-edit',
  templateUrl: './station-edit.component.html',
  styleUrl: './station-edit.component.css'
})
export class StationEditComponent {

  form: FormGroup;
  stations: Station[] = [];
  selectedCategories: string[] = [];
  categories = new FormControl('');
  categoriesList: Category[] = [];
  

  ngOnInit(): void {
  }

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<StationEditComponent>,
    private stationService: StationsService,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: { stationItem: Station, categories: Category[] },
  ){
    this.form = this.fb.group({
      name: [data.stationItem && data.stationItem.name ? data.stationItem.name : '' , Validators.required], 
      categories: this.initCategories(data.stationItem && data.stationItem.categories ? data.stationItem.categories : []),
    });
    this.categoriesList = data.categories;
   }

   private initCategories(categories: string[]): FormControl {
    const selectedCategories = categories || []; 
    return this.fb.control(selectedCategories);
}

   onCancel(): void {
    this.form.reset();
    this.dialogRef.close(false);
  }

  onSave(): void {
    if (this.form.valid){
      const stationItem: Station = this.form.value;
      const selectedCategories: string[] = this.form.value.categories;
      stationItem.categories = selectedCategories;
      this.dialogRef.close(stationItem);
    }else {
      this.notificationService.error("Das Formular ist nicht richtig ausgefüllt.")
      console.error('Form is invalid');
    }
  }

}