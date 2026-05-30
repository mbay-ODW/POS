import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NotificationService } from './services/notification.service';

const STORAGE_KEY = 'pos_auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router, private notificationService: NotificationService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const raw = localStorage.getItem(STORAGE_KEY);
    const token = raw ? JSON.parse(raw)?.token : null;

    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const authReq = request.clone({ withCredentials: true, setHeaders: headers });

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          localStorage.removeItem(STORAGE_KEY);
          this.router.navigate(['/login']);
          this.notificationService.error('Sitzung abgelaufen – bitte neu anmelden');
        } else if (error.status === 403) {
          this.notificationService.error('Keine Berechtigung für diese Aktion');
        } else if (error.status === 0) {
          this.notificationService.error('Server nicht erreichbar');
        }
        return throwError(error);
      })
    );
  }
}
