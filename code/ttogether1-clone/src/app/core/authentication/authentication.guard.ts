import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanActivateChild,
  UrlTree,
  ActivatedRoute
} from '@angular/router';

import { Logger } from '../logger.service';
import { Auth0Service } from './auth0.service';
import { Observable, of, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { PasswordLessService } from './password-less.service';

const log = new Logger('AuthenticationGuard');

// Sleep for a specified number of milliseconds
function sleepMsec(msecs: number): Promise<string> {
  // log.debug(`Sleeping for ${msecs} msecs`);
  return new Promise(resolve => setTimeout(resolve, msecs));
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationGuard implements CanActivate {
  constructor(
    private router: Router,
    private auth0Service: Auth0Service,
    private passwordLessService: PasswordLessService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean | UrlTree> | boolean {
    log.debug('(canActivate) url:', state.url);
    const url = state.url.split('?')[0];
    if (url === '/') {
      log.debug('(canActivate) authentication not required url:', url);
      return Promise.resolve(true);
    }
    log.debug('(canActivate) checking authentication url:', url);

    if (next.queryParams.ticket && next.queryParams.ticket !== this.passwordLessService.ticket) {
      log.debug('(canActivate) Logging out user from previous ticket');
      this.passwordLessService.logout();
    }
    if (next.queryParams.ticket && next.queryParams.ticket === this.passwordLessService.ticket) {
      log.debug('(canActivate) Maintaining existing passwordless login');
    }
    const ticket = next.queryParams.ticket || this.passwordLessService.ticket;

    if (ticket) {
      log.debug('(canActivate) using ticket');
      this.passwordLessService.ticket = ticket;
      if (this.passwordLessService.token) {
        return of(true);
      } else {
        return this.passwordLessService.getTokenFromTicket(ticket).pipe(
          map(token => {
            return token ? true : false;
          }),
          catchError(error => {
            throwError(error);
            this.router.navigate(['404']);
            return of(false);
          })
        ) as Observable<boolean>;
      }
    }

    return this.auth0Service.isAuthenticated$.pipe(
      tap(loggedIn => {
        if (!loggedIn) {
          log.debug('(canActivate) NOT Logged in url:', state.url);
          this.auth0Service.login(state.url);
        } else {
          log.debug('(canActivate) Already Logged in url:', state.url, 'loggedIn:', loggedIn);
        }
      })
    );
  }
}
