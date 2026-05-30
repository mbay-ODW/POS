import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Station } from 'src/app/interfaces/station';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
    selector: 'app-station-view',
    templateUrl: './station-view.component.html',
    styleUrl: './station-view.component.css',
    standalone: false
})
export class StationViewComponent {

  ngOnInit(): void {
  }

  constructor(
    public dialogRef: MatDialogRef<StationViewComponent>,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: { stationItem: Station, selectedCategories: string[] },
  ) {
  }

  onClose(): void {
    this.dialogRef.close(false);
  }


}