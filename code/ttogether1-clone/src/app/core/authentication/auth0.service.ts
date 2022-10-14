import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import createAuth0Client from '@auth0/auth0-spa-js';
import Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client';
import { from, of, Observable, combineLatest, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, concatMap, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Logger } from '@app/core/logger.service';
import { GlobalEvent, EventClass, EventType } from '@app/evnt/global-events';
import { Auth0Credentials } from './credentials.service';
import { PasswordLessService } from './password-less.service';

const log = new Logger('Auth0Service');

const config = {
  clientId: environment.auth0_clientId,
  domain: environment.auth0_domain,
  audience: environment.auth0_audience
};

@Injectable({
  providedIn: 'root'
})
export class Auth0Service {
  // Create an observable of Auth0 instance of client
  auth0Client$ = (from(
    createAuth0Client({
      domain: config.domain,
      client_id: config.clientId,
      audience: config.audience,
      redirect_uri: `${window.location.origin}`
    })
  ) as Observable<Auth0Client>).pipe(
    shareReplay(1), // Every subscription receives the same shared value
    catchError(err => throwError(err))
  );
  // Define observables for SDK methods that return promises by default
  // For each Auth0 SDK method, first ensure the client instance is ready
  // concatMap: Using the client instance, call SDK method; SDK returns a promise
  // from: Convert that resulting promise into an observable
  isAuthenticated$: Observable<any> = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.isAuthenticated())),
    tap(res => (this.loggedIn = res))
  );
  handleRedirectCallback$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.handleRedirectCallback()))
  );
  // Create subject and public observable of user profile data
  private userProfileSubject$ = new BehaviorSubject<GlobalEvent>({} as any);
  // tslint:disable-next-line: member-ordering
  userProfile$ = this.userProfileSubject$.asObservable();
  // Create a local property for login status
  // tslint:disable-next-line: member-ordering
  loggedIn: boolean = null;

  constructor(private router: Router, private passwordLessService: PasswordLessService) {
    // On initial load, check authentication state with authorization server
    // Set up local auth streams if user is already authenticated
    this.localAuthSetup();
    // Handle redirect from Auth0 login
    this.handleAuthCallback();
  }

  // When calling, options can be passed if desired
  // https://auth0.github.io/auth0-spa-js/classes/auth0client.html#getuser
  getUser$(options?: any): Observable<any> {
    if (this.passwordLessService.ticket) {
      return this.passwordLessService.getData().pipe(
        tap(tokenData => {
          this.loggedIn = true;
          const evt = new GlobalEvent(EventClass.Notify, this.loggedIn ? EventType.LoggedIn : EventType.LoggedOut);
          evt.sessionId = undefined;
          evt.subject = tokenData['https://t1.tsh.com/nickname'];
          evt.target = tokenData.sub;
          log.debug('getUser$ PWL sending global event:', JSON.stringify(evt.toFriendly()), 'loggedIn:', this.loggedIn);
          this.userProfileSubject$.next(evt);
        })
      );
    } else {
      return this.auth0Client$.pipe(
        concatMap((client: Auth0Client) => from(client.getUser(options))),
        tap(user => {
          if (user) {
            const evt = new GlobalEvent(EventClass.Notify, !this.loggedIn ? EventType.LoggedIn : EventType.LoggedOut);
            evt.sessionId = undefined;
            evt.subject = user.nickname;
            evt.target = user;
            log.debug('getUser$ sending global event:', JSON.stringify(evt.toFriendly()), 'loggedIn:', this.loggedIn);
            this.userProfileSubject$.next(evt);
          }
        })
      );
    }
  }

  getTokenSilently$(options?: any): Observable<string> {
    return this.auth0Client$.pipe(concatMap((client: Auth0Client) => from(client.getTokenSilently(options))));
  }

  private localAuthSetup() {
    // This should only be called on app initialization
    // Set up local authentication streams
    // if (this.passwordLessService.token) {
    //   const tokenData = this.passwordLessService.tokenData;
    //   if(this.passwordLessService.tokenData) {
    //     const evt = new GlobalEvent(EventClass.Notify, !this.loggedIn ? EventType.LoggedIn : EventType.LoggedOut);
    //     evt.sessionId = undefined;
    //     evt.subject = tokenData['https://t1.tsh.com/nickname'];
    //     evt.target = tokenData.sub;
    //     // log.debug('getUser$ sending global event:', evt, 'loggedIn:', this.loggedIn);
    //     this.userProfileSubject$.next(evt);
    //   }
    // } else  {
    const checkAuth$ = this.isAuthenticated$.pipe(
      concatMap((loggedIn: boolean) => {
        if (loggedIn || this.passwordLessService.ticket) {
          // If authenticated, get user and set in app
          // NOTE: you could pass options here if needed
          return this.getUser$();
        }
        // If not authenticated, return stream that emits 'false'
        return of(loggedIn);
      })
    );
    checkAuth$.subscribe();
    // }
  }

  // tslint:disable-next-line: member-ordering
  login(redirectPath: string = '/') {
    log.debug(`(login) redirectPath:${redirectPath}`);
    // A desired redirect path can be passed to login method
    // (e.g., from a route guard)
    // Ensure Auth0 client instance exists
    this.auth0Client$.subscribe((client: Auth0Client) => {
      // Call method to log in
      log.debug(`(login) redirect_uri:"${window.location.origin}"`);
      client.loginWithRedirect({
        redirect_uri: `${window.location.origin}`,
        appState: { target: redirectPath }
      });
    });
  }

  // tslint:disable-next-line: member-ordering
  handleAuthCallback() {
    // Call when app reloads after user logs in with Auth0
    const params = window.location.search;
    if (params.includes('code=') && params.includes('state=')) {
      let targetRoute: string; // Path to redirect to after login processsed
      const authComplete$ = this.handleRedirectCallback$.pipe(
        // Have client, now call method to handle auth callback redirect
        tap(cbRes => {
          // Get and set target redirect route from callback results
          targetRoute = cbRes.appState && cbRes.appState.target ? cbRes.appState.target : '/session/upcoming';
        }),
        concatMap(() => {
          // Redirect callback complete; get user and login status
          return combineLatest([this.getUser$(), this.isAuthenticated$]);
        })
      );
      // Subscribe to authentication completion observable
      // Response will be an array of user and login status
      authComplete$.subscribe(([user, loggedIn]) => {
        // Redirect to target route after callback processing
        this.router.navigateByUrl(targetRoute);
      });
    }
  }

  // tslint:disable-next-line: member-ordering
  logout() {
    log.debug('(logout)');
    // Ensure Auth0 client instance exists
    if (this.passwordLessService.ticket) {
      this.passwordLessService.logout();
    }

    this.getUser$().subscribe((creds: Auth0Credentials) => {
      this.auth0Client$.subscribe((client: Auth0Client) => {
        // Call method to log out
        client.logout({
          client_id: config.clientId,
          returnTo: window.location.origin
        });
        const evt = new GlobalEvent(EventClass.Notify, EventType.LoggedOut);
        evt.sessionId = undefined;
        evt.subject = creds.nickname;
        evt.target = creds;
        this.userProfileSubject$.next(evt);
      });
    });
  }
}
