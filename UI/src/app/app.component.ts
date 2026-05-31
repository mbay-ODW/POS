import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from './environments/environment';
import { AuthService } from './services/auth.service';
import { AppSettingsService } from './services/app-settings.service';

const FULLSCREEN_ROUTES = ['/login', '/customer-display'];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false
})
export class AppComponent implements OnInit {
  isProduction = environment.production;
  title = 'UI';
  showChrome = true;

  constructor(
    public auth: AuthService,
    public appSettings: AppSettingsService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.appSettings.load();
    this.updateChrome(this.router.url);
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => this.updateChrome(e.urlAfterRedirects));
  }

  private updateChrome(url: string): void {
    this.showChrome = !FULLSCREEN_ROUTES.some(r => url.startsWith(r));
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
