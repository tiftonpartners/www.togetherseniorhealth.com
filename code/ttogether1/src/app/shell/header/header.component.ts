import { Component, OnInit, ChangeDetectorRef, Inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SessionStateService } from '@ses/sessions/session-state.service';
import { GlobalEvent, EventType, ANY_SUBJECT, EMusicEvent, EventClass } from '@app/evnt/global-events';
import { GlobalEventService } from '@app/evnt/global-events.service';
import { Auth0Service } from '@app/core/authentication/auth0.service';
import { CredentialsService, I18nService, Logger } from '@app/core';
import { DOCUMENT } from '@angular/common';
import { EClientView } from '@app/shared/interfaces';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const log = new Logger('HeaderComponent');
const LOG_LEVEL_INFO = 'INFO';
const LOG_LEVEL_DEBUG = 'DEBUG';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  menuHidden = true;
  sessionValid = false;
  session: any;
  username: string;
  joined = false;
  view: EClientView;
  faIcon = 'question';

  // Fire events when music volume is changed
  commandTriggeredSource$ = new Subject<GlobalEvent>();
  // tslint:disable-next-line: member-ordering
  commandTriggered$ = this.commandTriggeredSource$.asObservable();

  /**
   * Hide/Show the header
   */
  isHide = true;

  private _onKeyDownFunction: () => {};

  // Dismisses/destroys all subscribed subjects
  private destroy$: Subject<void> = new Subject();

  constructor(
    private router: Router,
    private auth0Service: Auth0Service,
    private credentialService: CredentialsService,
    private i18nService: I18nService,
    private sessionStateService: SessionStateService,
    private changeDetector: ChangeDetectorRef,
    private globalEventService: GlobalEventService,
    @Inject(DOCUMENT) private _document: Document
  ) {
    this.globalEventService.newCommand$.pipe(takeUntil(this.destroy$)).subscribe(this.handleGlobalEvents);
    this.globalEventService.listenTo(this.commandTriggered$);

    this.sessionStateService.stateChanged$.subscribe((event: GlobalEvent) => {
      this.sessionValid = event.event === EventType.SessionJoined;
      this.updateFromSession();
      // tslint:disable-next-line: no-string-literal
      if (!this.changeDetector['destroyed']) {
        this.changeDetector.detectChanges();
      }
    });

    this.updateFromSession();
    this.updateFromCredentials();
  }

  handleGlobalEvents = (evt: GlobalEvent) => {
    try {
      switch (evt.event) {
        case EventType.LoggedIn:
        case EventType.LoggedOut:
          this.updateFromCredentials();
          break;

        case EventType.SessionLeft:
        case EventType.SessionJoined:
          this.updateFromSession();
          break;
      }
    } catch (e) {}
  };

  get _sessionStateService() {
    return this.sessionStateService;
  }

  updateFromCredentials = () => {
    if (!this.credentialService.isAuthenticated()) {
      this.username = '';
    } else {
      this.username = this.credentialService.credentials.nickname;
    }
  };

  updateFromSession = () => {
    if (this.sessionStateService.joined) {
      this.session = this.sessionStateService.session;
      this.view = this.sessionStateService.view;
      this.joined = true;

      switch (this.view) {
        case EClientView.GROUP:
          this.faIcon = 'fa-users';
          break;
        case EClientView.STREAM:
          this.faIcon = 'fa-video';
          break;
        case EClientView.INSTRUCTOR:
          this.faIcon = 'fa-chalkboard-teacher';
          break;
        default:
          this.faIcon = 'question';
      }
    } else {
      this.session = undefined;
      this.view = EClientView.UNKNOWN;
      this.faIcon = 'question';
      this.joined = false;
    }
  };

  ngOnInit() {
    this._document.addEventListener('keydown', this._onKeyDownFunction);
    // this.ngxAgoraService.AgoraRTC.Logger.setLogLevel(LogLevel.Info);
  }

  ngOnDestroy() {
    this._document.removeEventListener('keydown', this._onKeyDownFunction);
    this.destroy$.next();
    this.destroy$.complete();
    this.globalEventService.destroy();
  }

  toggleMenu() {
    this.menuHidden = !this.menuHidden;
  }

  setLanguage(language: string) {
    this.i18nService.language = language;
  }

  logout() {
    log.debug('(logout)');
    this.auth0Service.logout();
  }

  get currentLanguage(): string {
    return this.i18nService.language;
  }

  get languages(): string[] {
    return this.i18nService.supportedLanguages;
  }
}
