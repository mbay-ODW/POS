import { Component, OnInit } from '@angular/core';
import { environment } from './environments/environment';
import { AuthService } from './services/auth.service';
import { AppSettingsService } from './services/app-settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false
})
export class AppComponent implements OnInit {
  isProduction = environment.production;
  title = 'UI';

  constructor(
    public auth: AuthService,
    public appSettings: AppSettingsService,
  ) {}

  ngOnInit(): void {
    this.appSettings.load();
  }

  get isManager(): boolean {
    return this.auth.isManager();
  }

  get currentUser(): string {
    return this.auth.getUser()?.username ?? '';
  }

  get systemLogo(): string {
    return this.appSettings.get('system.logo');
  }

  get systemName(): string {
    return this.appSettings.get('system.name');
  }

  onLogout(): void {
    this.auth.logout();
  }
}
