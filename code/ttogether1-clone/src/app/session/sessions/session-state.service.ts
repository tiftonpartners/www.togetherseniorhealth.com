import { Injectable } from '@angular/core';
import { EventType, EventClass, GlobalEvent } from '@app/evnt/global-events';
import { GenericSession } from '@ses/sessions/session';
import { CredentialsService } from '@app/core';
import { Logger } from '@app/core';
import { Subject } from 'rxjs';
import { Auth0Service } from '@app/core/authentication/auth0.service';
import { EClientView } from '@app/shared/interfaces';

const log = new Logger('SessionState');

// What view of the session do we currently have?
export enum SessionView {
  Grid = 'x',
  Group = 'g',
  Instructor = 'i',
  Spotlight = 'p',
  Stream = 's',
  None = '-',
  Unknown = '?'
}

export function SessionViewToString(view: EClientView) {
  return view;
}

export function SessionViewFromString(viewStr: SessionView): SessionView {
  switch (viewStr.toLowerCase()) {
    case 'grid':
    case 'x':
      return SessionView.Grid;
    case 'group':
    case 'g':
      return SessionView.Group;
    case 'stream':
    case 's':
      return SessionView.Stream;
    case 'instructor':
    case 'instr':
    case 'i':
      return SessionView.Instructor;
    case 'spotlight':
    case 'p':
      return SessionView.Spotlight;
    case 'none':
    case '-':
      return SessionView.None;
    default:
      return SessionView.Unknown;
  }
}

const LS_CURRENT_SESSION_KEY = 'current_session';

// Keeps track of the current session, session state, and room (if any).
// Also tracks provider-specific authentication tokens specific to this
// session (if any)
//
@Injectable({
  providedIn: 'root'
})
export class SessionStateService {
  session: GenericSession | null = null;
  room: any = null;
  joined = false; // Are we currently joined to a session?
  token: string | null = null; // Provider-specific token for access to this session
  tokenJSON: any; // Provider-specific token in JSON format
  username: string;
  view = EClientView.GROUP;
  forcedTime = ''; // Are we forcing time?

  // Fire an observable every time the state changes.  Value will
  // be false when we close the session
  private stateChangedSource$ = new Subject<GlobalEvent>();
  // tslint:disable-next-line: member-ordering
  stateChanged$ = this.stateChangedSource$.asObservable();

  constructor(private auth0Service: Auth0Service, private credentialService: CredentialsService) {
    this.auth0Service.userProfile$.subscribe(this.handleGlobalEvents);
  }

  handleGlobalEvents = (evt: GlobalEvent) => {
    try {
      if (evt.target === undefined) {
        return;
      }
      switch (evt.event) {
        case EventType.LoggedIn:
          this.username = evt.target.nickname;
          break;
        case EventType.LoggedOut:
          this.close();
          break;
      }
    } catch (e) {
      log.debug('handleGlobalEvents error:', e);
    }
  };

  get sessionName(): string | null {
    return this.session ? this.session.name : null;
  }

  get sessionAcronym(): string | null {
    return this.session ? this.session.acronym : null;
  }

  get isJoined() {
    return this.joined;
  }

  get viewStr() {
    return SessionViewToString(this.view);
  }

  /**
   * Set the current (forced) time for testing purposes.
   * Note that once the time is set, it can be updated,
   * but not cleared.
   *
   * @param forcedTime New time for testing purposes, in ISO 1806 format UTC,
   * such as '2020-12-09T18:15:00.000Z'
   * @returns The new value of the forced time
   */
  forceTime(forcedTime: string): string {
    if (!forcedTime || forcedTime.length === 0) {
      return this.forcedTime;
    }
    this.forcedTime = forcedTime;
    return this.forcedTime;
  }

  /**
   * Are we forcing time?
   */
  isTimeForced(): boolean {
    return !!this.forcedTime && this.forcedTime.length > 0;
  }

  setView(view: EClientView) {
    this.view = view;
    const evt: GlobalEvent = new GlobalEvent(EventClass.Notify, EventType.ViewChanged);
    evt.sessionId = this.sessionAcronym;
    evt.subject = this.credentialService.credentials.sub;
    evt.target = view.toString();
    log.debug('SessionChanged:', evt.toFriendly());
    this.stateChangedSource$.next(evt);
  }

  /**
   * Save the user selected session
   *
   * session Session to Save
   * triggerEvent Trigger the sessionJoined Event
   * forceTime Current time forced for testing purposes
   */
  setState(session: GenericSession, triggerEvent: boolean = true, forcedTime: string = '') {
    this.forceTime(forcedTime);
    const forced = !!this.forcedTime && this.forcedTime.length > 0;
    log.debug('(setState) ForcedTime:', this.forcedTime);

    if (this.session) {
      // Nofify that we've left the old session
      const c = new GlobalEvent(EventClass.Notify, EventType.SessionLeft);
      c.sessionId = this.session.acronym;
      c.subject = this.credentialService.credentials.sub;
      c.target = forced ? { forceTime: this.forcedTime } : {};
      this.stateChangedSource$.next(c);
    }

    this.session = session;
    this.joined = true;
    this.room = null;

    if (triggerEvent) {
      const cmd = new GlobalEvent(EventClass.Notify, EventType.SessionJoined);
      cmd.subject = this.credentialService.credentials.sub;
      cmd.sessionId = session.acronym;
      cmd.target = forced ? { forceTime: this.forcedTime } : {};
      log.debug('StateChanged:', JSON.stringify(cmd.toFriendly()));
      this.stateChangedSource$.next(cmd);
    } else {
      log.debug('StateChanged Silently for session:', session.acronym, 'forcedTime:', this.forcedTime);
    }

    this._persistSession();
  }

  setToken(token: string) {
    this.token = token;
  }

  getSession() {
    if (!this.session) {
      this.session = this._getSavedSesion();
    }

    return this.session;
  }

  close() {
    log.debug('Closing session:', JSON.stringify(this.session));
    if (this.joined) {
      // Nofify that we've left the old session
      const c = new GlobalEvent(EventClass.Notify, EventType.SessionLeft);
      c.sessionId = this.session.acronym;
      c.subject = this.credentialService.credentials.sub;
      this.joined = false;
      this.stateChangedSource$.next(c);
    }

    this.session = null;
    this.room = null;
    this.token = null;
    this.joined = false;
    this.view = EClientView.GROUP;
    sessionStorage.removeItem(LS_CURRENT_SESSION_KEY);
  }

  private _getSavedSesion(): GenericSession {
    if (sessionStorage) {
      const data = sessionStorage.getItem(LS_CURRENT_SESSION_KEY) || '{}';
      const jsonData = JSON.parse(data);
      const session = new GenericSession(jsonData);

      return session;
    }

    return new GenericSession();
  }

  private _persistSession() {
    if (sessionStorage) {
      sessionStorage.setItem(LS_CURRENT_SESSION_KEY, JSON.stringify(this.session || ''));
    }
  }
}
