import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../services/settings.service'; // Adjust the path accordingly
import { Setting } from '../interfaces/setting';
import { MatDialog } from '@angular/material/dialog';
import { DeleteComponent } from '../dialogs/delete/delete.component';
import { NotificationService } from '../services/notification.service';
import { MatDialogConfig } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit{
  settings: Setting[] = [];
  isLoading: boolean = false;


  constructor(
    private settingsService: SettingsService,
    public matDialog:MatDialog,
    private notification:NotificationService,
    ) { }



    ngOnInit(): void {
      this.getSettings();
    }


    getSettings(){
      this.isLoading = true; // Start loading
      this.settingsService.getSettings().subscribe(response => {
        this.settings = response.data;
        this.isLoading = false; // Stop loading
      });
    }


    deleteSetting(id: string): void {
      const type = "setting";
      const dialogRef = this.matDialog.open(DeleteComponent,{data: {type}});
    
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.isLoading = true; // Start loading
          this.settingsService.deleteSetting(id).subscribe(
            () => {
              this.getSettings();
              this.notification.info("Successfully deleted")
              this.isLoading = false; // Stop loading
            },
            error => {
              this.notification.error("Error in deletion: " + error.message)
              this.isLoading = false; // Stop loading
            }
          );
        }
      });
  
  }

  editSetting(id?: string): void {
   
  }


}
