import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Setting } from 'src/app/interfaces/setting';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-setting-view',
  templateUrl: './setting-view.component.html',
  styleUrl: './setting-view.component.css'
})
export class SettingViewComponent {


  ngOnInit(): void {
  }

  constructor(
    public dialogRef: MatDialogRef<SettingViewComponent>,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: { settingItem: Setting },
  ) {}

  onClose(): void {
    this.dialogRef.close(false);
  }

}
