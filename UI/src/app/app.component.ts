import { Component } from '@angular/core';
import { environment } from './environments/environment';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false
})
export class AppComponent {
  isProduction = environment.production;
  title = 'UI';

  constructor(public auth: AuthService) {}

  get isManager(): boolean {
    return this.auth.isManager();
  }

  get currentUser(): string {
    return this.auth.getUser()?.username ?? '';
  }

  onLogout(): void {
    this.auth.logout();
  }
}
