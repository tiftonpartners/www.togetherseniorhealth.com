import { Injectable } from '@angular/core';
import { Logger, CredentialsService, Auth0Service } from '@app/core';
import { Subject, Observable } from 'rxjs';
import { SessionStateService } from '@app/session/sessions/session-state.service';
import { Router } from '@angular/router';
import { EventClass, EventType, GlobalEvent, SERVER } from './global-events';
import { environment } from '@env/environment';
import io from 'socket.io-client';
import { GAEvent } from './ga-events';
import { AnalyticsService } from '@app/analytics/analytics.service';
import { takeUntil } from 'rxjs/operators';
const parser = require('socket.io-json-parser');

const log = new Logger('GlobalEventsService');

// Establishes a websocket connection to the server and performs
// some minimum routing and filtering of commands and notifications
// between the server and the browser.  For example,
// certain messages that aren't relevant when not in a session or when
// not authenticated are ignored.
//
@Injectable({
  providedIn: 'root'
})
export class GlobalEventService {
  private socket: SocketIOClient.Socket = {} as SocketIOClient.Socket;

  private newCommandSource$ = new Subject<any>();
  // Other components and services can subscribe to newCommand$ to
  // get notifications when new commands arrive
  // tslint:disable-next-line: member-ordering
  newCommand$ = this.newCommandSource$.asObservable();

  // Dismisses/destroys all subscribed subjects
  private destroy$: Subject<void> = new Subject();
  // Sticky holds the general activity like stateChanged$ and userProfile$
  private sticky$: Subject<void> = new Subject();

  // tslint:disable-next-line: member-ordering

  constructor(
    private sessionStateService: SessionStateService,
    private credentialService: CredentialsService,
    private auth0Service: Auth0Service,
    private router: Router,
    private analyticsService: AnalyticsService
  ) {
    try {
      // @ts-ignore
      this.socket = io(environment.websocketServerPrefix, { parser, timeout: environment.production ? 40000 : 120000 });

      this.socket.on('connect', () => {
        log.debug(
          '(socket.io) connect, id:',
          this.socket.id,
          'Session:',
          JSON.stringify(
            this.sessionStateService.getSession().isValid() ? this.sessionStateService.getSession() : 'INVALID'
          )
        );
        if (this.sessionStateService.getSession().isValid() && this.credentialService.isAuthenticated()) {
          const c = new GlobalEvent(EventClass.Notify, EventType.SessionJoined);
          c.sessionId = this.sessionStateService.getSession().acronym;
          c.subject = this.credentialService.credentials.sub;
          log.debug('(evt) ToServer:', JSON.stringify(c.toFriendly()));
          this.socket.emit('message', c);
        }

        analyticsService.send(GAEvent.socketConnect, 1, 100);
      });

      this.socket.on('disconnect', () => {
        log.debug('(socket.io) disconnect id:', this.socket.id);

        analyticsService.send(GAEvent.socketConnect, 0, 0);
      });

      this.socket.on('message', (evt: GlobalEvent) => {
        // Incomming events from the server
        try {
          if (this.credentialService.isAuthenticated()) {
            GlobalEvent.ConvertFromAny(evt);
            // Ignore commands if not authenticated
            log.debug('(evt) FromServer:', JSON.stringify(evt.toFriendly()));
            this.newCommandSource$.next(evt);
          }
        } catch (e) {
          log.debug('this.socket.on message', e);
        }
      });
    } catch (e) {
      log.error('(socket.io) error:', e);
    }

    this.listenTo(this.sessionStateService.stateChanged$, true);
    this.listenTo(this.auth0Service.userProfile$, true);
  }

  /**
   * @description this disconnected all the subscriptions acquired through listenTo.
   *  This is to avoid multiple instances of subscribers in a given instance.
   */
  destroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * @description Receive events from Components or Services. They are
   *  sent to the server, and forwarded to other listeners
   *  of global events
   * @param observer$ Observable
   * @param sticky boolean
   */
  listenTo = (observer$: Observable<GlobalEvent>, sticky: boolean = false) => {
    observer$.pipe(takeUntil(sticky ? this.sticky$ : this.destroy$)).subscribe((event: GlobalEvent) => {
      try {
        if (event.target === undefined) {
          return;
        }
        log.debug('(evt) ToServer:', JSON.stringify(event.toFriendly()));
        this.socket.emit('message', event);
        if (event.subject !== SERVER) {
          this.newCommandSource$.next(event);
        }
      } catch (e) {
        log.error('listenTo error', e);
      }
    });
  };
}
