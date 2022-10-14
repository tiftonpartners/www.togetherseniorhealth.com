import { Injectable } from '@angular/core';
import { Auth0Service } from './auth0.service';
import { GlobalEvent } from '@app/evnt/global-events';
import { Logger } from '@app/core/logger.service';
import { BehaviorSubject } from 'rxjs';
import * as jwtDecode from 'jwt-decode';
import { PasswordLessService } from './password-less.service';

const log = new Logger('CredentialsService');

// These are permissions defined in Auth0.  The
// string values need to match the definitions
// of the permissions there.
export enum Auth0Permission {
  query_session = 'query:session',
  read_session = 'read:session',
  setglobal_logout = 'setglobal:logout',
  setglobal_mute = 'setglobal:mute',
  setremote_mute = 'setremote:mute',
  setremote_view = 'setremote:view',
  setglobal_view = 'setglobal:view',
  stream_instuctorview = 'stream:instuctorview',
  test_session = 'test:session',
  update_session = 'update:session',
  ignore_globalcmds = 'ignore:globalcmds'
}

export interface Auth0Credentials {
  // Credentials from Auth0
  sub: string;
  nickname: string;
  name: string;
  picture: string;
  updated_at?: string;
  email?: string;
  email_verified?: boolean;
}

export interface Auth0CredentialsToken {
  permissions?: string[];
}

const credentialsKey = 'credentials';

/**
 * Provides storage for authentication credentials.
 * The Credentials interface should be replaced with proper implementation.
 */
@Injectable({
  providedIn: 'root'
})
export class CredentialsService {
  public onPermissionsReady$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private _credentials: Auth0Credentials | null = null;
  private _token: Auth0CredentialsToken = {};

  constructor(auth0Service: Auth0Service, private passwordLessService: PasswordLessService) {
    const savedCredentials = sessionStorage.getItem(credentialsKey) || sessionStorage.getItem(credentialsKey);
    if (savedCredentials) {
      this._credentials = JSON.parse(savedCredentials);
      log.debug('(constructor) restoring credentials from session storage:', this._credentials);
    }
    auth0Service.userProfile$.subscribe((evt: GlobalEvent) => {
      if (evt.target === undefined) {
        return;
      }

      log.debug('(evt) Credential Service userProfile$ evt:', JSON.stringify(evt.toFriendly(), null, 2));
      this._credentials = evt ? evt.target : null;

      if (this.passwordLessService.token) {
        this.setCredentialsFromPasswordLessService();
        this.onPermissionsReady$.next(true);
      } else {
        auth0Service.getTokenSilently$().subscribe((token: string) => {
          log.debug('(evt) Credential Service userProfile$ Token:', token);

          // TODO: Add token validation
          this._token = jwtDecode(token);
          this.onPermissionsReady$.next(true);
        });
      }
    });
  }

  // Get the permissions for the user, returning an array
  // of the strings representing the permission.
  // These are obtained from the JWT token from Auth0
  /**
   * Get current user permissions as an array of permissions
   */
  get permissions(): string[] {
    const { permissions = [] } = this._token;
    return permissions;
  }

  // Determine if the current user has a given permission
  hasPermission(p: Auth0Permission) {
    return this.permissions.includes(p.toString());
  }

  isAnInstructor(): boolean {
    return this.permissions.includes(Auth0Permission.ignore_globalcmds);
  }

  // Determine if the current user has any one of the given permissions
  hasAnyPermission(perms: Auth0Permission[]): boolean {
    for (const p of perms) {
      if (this.hasPermission(p)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks is the user is authenticated.
   * @return True if the user is authenticated.
   */
  isAuthenticated(): boolean {
    return !!this._credentials;
  }

  /**
   * Gets the user credentials.
   * @return The user credentials or null if the user is not authenticated.
   */
  get credentials(): Auth0Credentials | null {
    if (!this._credentials && this.passwordLessService.token) {
      this.setCredentialsFromPasswordLessService();
    }
    return this._credentials;
  }

  /**
   * Sets the user credentials.
   * The credentials may be persisted across sessions by setting the `remember` parameter to true.
   * Otherwise, the credentials are only persisted for the current session.
   * @param credentials The user credentials.
   * @param remember True to remember credentials across sessions.
   */
  setCredentials(credentials?: Auth0Credentials, remember?: boolean) {
    log.debug('(setCredentials) credentials:', JSON.stringify(credentials));
    this._credentials = credentials || null;

    if (credentials) {
      const storage = remember ? sessionStorage : sessionStorage;
      storage.setItem(credentialsKey, JSON.stringify(credentials));
    } else {
      sessionStorage.removeItem(credentialsKey);
      log.debug('(setCredentials) clearing session credentials');
    }
  }

  private setCredentialsFromPasswordLessService(): Auth0Credentials | null {
    if (this.passwordLessService.token) {
      this._token = this.passwordLessService.tokenData;
      this._credentials = {
        sub: this.passwordLessService.tokenData.sub,
        name: this.passwordLessService.tokenData['https://t1.tsh.com/name'],
        nickname: this.passwordLessService.tokenData['https://t1.tsh.com/nickname'],
        picture: this.passwordLessService.tokenData['https://t1.tsh.com/picture']
      };
      return this._credentials;
    }

    return null;
  }
}
