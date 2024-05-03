import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NotificationService } from './services/notification.service';

import { environment } from './environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  name: string | null = null;
  role: string | null = null;
  userInfo: any | any;
  private baseUrl = environment.baseUrl;

  constructor(private router: Router, private notificationService: NotificationService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const noCacheHeaders = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    const authReq = request.clone({
      // withCredentials is needed to pass authelia with own token
      withCredentials: true,
      setHeaders: noCacheHeaders,
    });


    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // If a 401 Unauthorized response was received, handle token expiration
          this.notificationService.error("Nicht eingelogt:" + error.message)
          setTimeout(() => {
            window.location.href = '/home';
          }, 3000);
        } else if( error.status == 403){
          this.notificationService.error("Nicht erlaubt:" + error.message)
        } else if ( error.status == 0){
          this.notificationService.error("Server nicht erreichbar:" + error.message)
          setTimeout(() => {
            window.location.href = '/home';
          }, 3000);
        }
        return throwError(error); // Re-throw the error for further handling
      })
    );
  }

}
