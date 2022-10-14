import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { BodyClassComponent } from '@app/shared/body-class.component';
import { DOCUMENT } from '@angular/common';
import { CredentialsService, Logger } from '@app/core';
import { ClassSession } from '../sessions/class';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionApiService } from '../sessions/session-api.service';
import { Subscription, throwError } from 'rxjs';
import { WINDOW } from '@app/core/services/window.service';
import { first } from 'rxjs/operators';

const log = new Logger('SessionLeaveComponent');
@Component({
  selector: 'app-session-leave',
  templateUrl: './session-leave.component.html',
  styleUrls: ['./session-leave.component.scss']
})
export class SessionLeaveComponent extends BodyClassComponent implements OnInit, OnDestroy {
  bodyClass = 'session-leave';
  isEarly = true;
  nickname = '';
  currentSession: ClassSession;
  nextSession: ClassSession;
  nextSessionDateMessage = '';
  isLast = false;

  private _forcedTime = '';
  private _currentClass$: Subscription;
  private _upcomingSession$: Subscription;

  constructor(
    @Inject(DOCUMENT) public document: Document,
    @Inject(WINDOW) public window: Window,
    private activatedRoute: ActivatedRoute,
    private credentialsService: CredentialsService,
    private router: Router,
    private sessionApiService: SessionApiService
  ) {
    super(document);
  }

  ngOnInit() {
    super.ngOnInit();
    log.debug('(ngOnInit)');
    const { acronym = '' } = this.activatedRoute.snapshot.params || {};
    const { forceTime = '' } = this.activatedRoute.snapshot.queryParams || {};
    this._forcedTime = forceTime;

    this.nickname = this.credentialsService.credentials.nickname;

    this._currentClass$ = this.sessionApiService.getGenericSession$(acronym).subscribe(
      klass => {
        this.currentSession = klass.firstSession;

        this.isLast = this.currentSession.isLast;
        this.isEarly = this.currentSession.getIsOpenNow();

        /* Get the next session */
        if (/* this.currentSession.inProgressSocial &&  */ !this.isLast) {
          this._upcomingSession$ = this.sessionApiService.getUpcoming(this._forcedTime).subscribe(sessions => {
            const firstClass = sessions && sessions.length && sessions[0];
            if (firstClass) {
              let firstSession = firstClass.sessions && firstClass.sessions.length && firstClass.sessions[0];
              if (firstSession.acronym === this.currentSession.acronym) {
                const secondClass = sessions && sessions.length > 0 && sessions[1];
                firstSession = secondClass.sessions && secondClass.sessions.length && secondClass.sessions[0];
              }
            }
          });
        }
      },
      error => {
        /* If the session does not exist the user is redirected to the home page */
        throwError(error);
        this.redirectOnError();
      }
    );
  }

  ngOnDestroy() {
    super.ngOnDestroy();

    if (this._currentClass$) {
      this._currentClass$.unsubscribe();
    }

    if (this._upcomingSession$) {
      this._upcomingSession$.unsubscribe();
    }
  }

  returnToClass() {
    if (this.currentSession) {
      this.router.navigate([`/session/agora/group/${this.currentSession.acronym}`]);
    }
  }

  closeWIndow() {
    if (this.window) {
      this.window.close();
    }
  }

  private redirectOnError() {
    this.router.navigate(['/session/upcoming']);
  }
}
