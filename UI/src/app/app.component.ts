import { Component } from '@angular/core';
import { environment } from './environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isProduction: boolean = environment.production;
  title = 'UI';


  onLogout() {
    // Redirect to an external webpage
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('name');
     window.location.href = 'https://authelia.drk-odw.de/logout';
  }

}
