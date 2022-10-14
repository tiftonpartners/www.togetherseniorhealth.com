import { Injectable, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';
import { Auth0Service } from '@app/core/authentication/auth0.service';
import { PasswordLessService } from '../authentication/password-less.service';

// HTTP Interceptor to add Auth0 JWT tokens to
// an API request
@Injectable({
  providedIn: 'root'
})
export class TokenInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const passwordLessService = this.injector.get(PasswordLessService);
    const auth0Service = this.injector.get(Auth0Service);
    if (!passwordLessService.ticketExists) {
      return auth0Service.getTokenSilently$().pipe(
        mergeMap(token => {
          const tokenReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
          });
          return next.handle(tokenReq);
        }),
        catchError(err => throwError(err))
      );
    } else {
      if (!passwordLessService.token) {
        return next.handle(req);
      } else {
        const tokenReq = req.clone({
          setHeaders: { Authorization: `Bearer ${passwordLessService.token}` }
        });
        return next.handle(tokenReq);
      }
    }
  }
}
