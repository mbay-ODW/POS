import { Injectable, NgZone } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {

  constructor(
    public snackbar: MatSnackBar,
    private zone: NgZone,
  ) { }

  error(message: string) {
    const config = new MatSnackBarConfig();
    config.panelClass = ['background-red'];
    config.verticalPosition = 'top';
    config.horizontalPosition = 'right';
    config.duration = 5000;
    this.zone.run(() => {
      this.snackbar.open(message, 'x', config);
    });
  }


  info(message: string) {
    const config = new MatSnackBarConfig();
    config.panelClass = ['background-green'];
    config.verticalPosition = 'top';
    config.horizontalPosition = 'right';
    config.duration = 5000;
    this.zone.run(() => {
      this.snackbar.open(message, 'x', config);
    });
  }

}