import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Logger } from '@app/core/logger.service';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Auth0Token } from './user.types';
import * as jwtDecode from 'jwt-decode';
import { WINDOW } from '../services/window.service';

const PWSLESS_LS_TICKET = 'PWSLESS_LS_TICKET';
const PWSLESS_LS_TOKEN = 'PWSLESS_LS_TOKEN';
const ID_PREFIX = 'pwdless-';

const log = new Logger('PasswordLessService');

@Injectable({
  providedIn: 'root'
})
export class PasswordLessService {
  public onTokenDataLoaded$: Subject<Auth0Token> = new Subject<Auth0Token>();

  private _ticket: string;
  private _token: string;

  private _tokenData: Auth0Token;

  constructor(private http: HttpClient, @Inject(WINDOW) private window: Window) {}

  set ticket(ticket: string) {
    this._ticket = ticket;
    this.saveOnLocalState(PWSLESS_LS_TICKET, this._ticket);
  }

  get ticket(): string {
    const ticket = this._ticket ? this._ticket : this.getFromLocalState(PWSLESS_LS_TICKET);
    return ticket;
  }

  get token(): string {
    this._token = this._token || this.getFromLocalState(PWSLESS_LS_TOKEN);
    return this._token;
  }

  get tokenData(): Auth0Token {
    if (!this._tokenData && this.token) {
      this._tokenData = jwtDecode<Auth0Token>(this.token);
    }
    return this._tokenData;
  }

  get ticketExists(): boolean {
    return this._ticket ? true : false;
  }

  /**
   * Get token from a ticket
   *
   * @param  ticket URL Ticket paramenter
   * @returns JWT String
   */
  getTokenFromTicket(ticket: string): Observable<string> {
    if (this._token) {
      return of(this._token);
    }

    return this.http.get(`/api/v1/pwdless/token/${ticket}`).pipe(
      map((response: { token: string }) => {
        this._token = response.token;
        this._tokenData = jwtDecode<Auth0Token>(this._token);
        this.onTokenDataLoaded$.next(this._tokenData);
        this.saveOnLocalState(PWSLESS_LS_TOKEN, this._token);
        return this.token;
      })
    );
  }
  /**
   * Get the user data or the Observable in order to get the user data
   */
  getData(): Observable<Auth0Token> {
    if (this._tokenData) {
      return of(this._tokenData);
    }

    return this.onTokenDataLoaded$;
  }

  logout() {
    log.debug('(logout)');
    this._token = this._ticket = null;
    this.saveOnLocalState(PWSLESS_LS_TICKET, '');
    this.saveOnLocalState(PWSLESS_LS_TOKEN, '');
  }

  private generateRandomString() {
    const random = Math.round(Math.random() * 10000000);
    return `${ID_PREFIX}${random}`;
  }

  private saveOnLocalState(key: string, value: string) {
    if (sessionStorage) {
      sessionStorage.setItem(key, value);
    }
  }

  private getFromLocalState(key: string): string {
    if (sessionStorage) {
      return sessionStorage.getItem(key) || '';
    }

    return '';
  }
}
