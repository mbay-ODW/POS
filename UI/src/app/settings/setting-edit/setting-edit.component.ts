import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Setting } from 'src/app/interfaces/setting';
import { NotificationService } from 'src/app/services/notification.service';
import { SettingsService } from 'src/app/services/settings.service';

@Component({
  selector: 'app-setting-edit',
  templateUrl: './setting-edit.component.html',
  styleUrls: ['./setting-edit.component.css']
})
export class SettingEditComponent {


  form: FormGroup;
  settings: Setting[] = [];
  

  ngOnInit(): void {
  }

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<SettingEditComponent>,
    private settingService: SettingsService,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: { settingItem: Setting },
  ){
    this.form = this.fb.group({
      name: [data.settingItem && data.settingItem.name ? data.settingItem.name : '' , Validators.required], 
      description: [data.settingItem && data.settingItem.description ? data.settingItem.description : '', Validators.required], 
      value: [data.settingItem && data.settingItem.value ? data.settingItem.value : '', Validators.required],
    });
   }

   onCancel(): void {
    this.form.reset();
    this.dialogRef.close(false);
  }

  onSave(): void {
    if (this.form.valid){
      const settingItem: Setting = this.form.value;
      this.dialogRef.close(settingItem);
    }else {
      this.notificationService.error("Das Formular ist nicht richtig ausgefüllt.")
      console.error('Form is invalid');
    }
  }

}
