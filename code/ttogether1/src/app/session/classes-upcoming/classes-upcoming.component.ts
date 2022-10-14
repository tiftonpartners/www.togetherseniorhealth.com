import * as moment from 'moment-timezone';
import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { SessionStateService } from '@app/session/sessions/session-state.service';
import { SessionApiService } from '@app/session/sessions/session-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Logger } from '@app/core/logger.service';
import { CredentialsService, Auth0Permission, Auth0Credentials } from '@app/core';
import { Subscription } from 'rxjs';
import { AdhocSession, SessionTimeframe } from '@app/session/sessions/session';
import { ClassObject, ClassSchedule, ClassSession } from '@app/session/sessions/class';
import { BodyClassComponent } from '@app/shared/body-class.component';
import { DOCUMENT } from '@angular/common';
const { detect } = require('detect-browser');
const browser = detect();

const log = new Logger('ClassesUpcoming');
const INTERVAL_REFRESH = 30 * 1000; // 30 seconds

const SUPPORTED_OSS = ['Mac OS', 'Windows 10', 'Chrome OS', 'Linux'];
const SUPPORTED_BROWSERS = ['chrome'];

@Component({
  selector: 'app-classes-upcoming',
  templateUrl: './classes-upcoming.component.html',
  styleUrls: ['./classes-upcoming.component.scss']
})
export class ClassesUpcomingComponent extends BodyClassComponent implements OnInit, OnDestroy {
  classes: ClassObject[] = [];
  userProfile: Auth0Credentials;
  canSeeTestLinks = false;
  isAnInstructor = false;
  secondMessage = '';
  forcedTime: string; /* Force definition of time for testing purposes */
  _forcedTime: moment.Moment; /* Forced time as a moment, if set */
  timeIsForced = false; /* Set only if forced to a valid time */

  userAgentStr = 'unknown';
  userAgentIsSupported = false;

  private onPermissionsReady$: Subscription;
  private refreshSessionTimeInterval = 0;

  constructor(
    private sessionStateService: SessionStateService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private credentialService: CredentialsService,
    private sessionApiService: SessionApiService,
    @Inject(DOCUMENT) document: Document
  ) {
    super(document);
    this.bodyClass = 'UpcomingSessions';
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    log.debug('(onDestroy)');
    window.clearInterval(this.refreshSessionTimeInterval);
    if (this.onPermissionsReady$) {
      this.onPermissionsReady$.unsubscribe();
    }
  }

  ngOnInit() {
    super.ngOnInit();

    this.userAgentStr = `${browser.name[0].toUpperCase() + browser.name.slice(1)}`;
    this.userAgentIsSupported = SUPPORTED_BROWSERS.includes(browser.name) && SUPPORTED_OSS.includes(browser.os);
    log.debug('(ngOnInit) Browser:', JSON.stringify(browser), 'isSupported:', this.userAgentIsSupported);

    const queryParams = this.activatedRoute.snapshot.queryParams;
    const { forceTime = null } = queryParams || {};
    this.forcedTime = forceTime;
    if (this.forcedTime && this.forcedTime.length > 0) {
      log.debug('(ngOnInit) Forcing time:', this.forcedTime);
      this._forcedTime = moment(this.forcedTime, moment.ISO_8601);
      this.timeIsForced = this.forcedTime && this._forcedTime.isValid();
    }

    try {
      this.onPermissionsReady$ = this.credentialService.onPermissionsReady$.subscribe(() => {
        this.userProfile = this.credentialService.credentials;
        this.isAnInstructor = this.credentialService.isAnInstructor();
        this.canSeeTestLinks = this.credentialService.hasPermission(Auth0Permission.test_session);
      });
      this.sessionApiService.getUpcoming(this.forcedTime).subscribe((classSessions: ClassObject[]) => {
        this.sessionApiService.getUpcomingAdHoc(this.forcedTime).subscribe((adHocSessions: AdhocSession[]) => {
          const adhocClasses = adHocSessions.map(session => {
            return ClassObject.NewFromAdHocSession(session);
          });
          this.classes = ClassObject.SortClassesByFirstSession([...classSessions, ...adhocClasses]);
          this.classes.forEach(this.reformatTimeToLocal.bind(this));
          this.refreshSessionTimeInterval = window.setInterval(this.refreshClassMessages.bind(this), INTERVAL_REFRESH);
          this.refreshClassMessages();

          console.log('===== Classes: ', this.classes);
        });
      });
    } catch (e) {
      log.error('ERROR getting sessions:', e);
    }
  }

  reformatTimeToLocal(clss: ClassObject) {
    const {
      schedule: { startTime, ...schedule },
      firstSession: { scheduledStartTime }
    } = clss;
    /** generate proper start date moment */
    const startDate = moment(scheduledStartTime).tz(startTime.tz);
    const localDate = moment(scheduledStartTime).tz(moment.tz.guess());

    /** build local schedule based on given schedule */
    clss.scheduleLocal = new ClassSchedule({
      startTime: {
        hour: localDate.format('HH'),
        mins: localDate.format('mm'),
        tz: moment.tz.guess()
      },
      weekdays: schedule.weekdays.map(weekday => {
        const day = parseInt(
          moment()
            .day(weekday)
            .format('d'),
          10
        );
        // convert and maintain a consistent format
        return moment()
          .day((day + (localDate.get('date') - startDate.get('date'))) % 7)
          .format('ddd')
          .toLowerCase();
      })
    });
    clss.scheduleLocalStr = clss.scheduleLocal.getWeekdaysStr() + ' ' + localDate.format('h:mm A');
  }

  enterToSession(session: ClassSession) {
    log.debug('(enterToSession) Entering session', session.name, 'ForcedTime:', this.forcedTime);
    this.sessionStateService.setState(session, false, this.forcedTime);
    this.router.navigate([`/check`]);
  }

  copyULRtoClipboard() {
    navigator.clipboard.writeText(window.location.href);
    log.debug('(copyULRtoClipboard) URL:', window.location.href);
  }

  getScheduleDate(scheduleDateTime: string): string {
    let pos = scheduleDateTime.search(':');
    if (pos !== -1) {
      while (1) {
        pos = pos - 1;
        if (pos === 0 || scheduleDateTime[pos] === ' ') {
          break;
        }
      }

      return scheduleDateTime.substring(0, pos);
    }
    return scheduleDateTime;
  }

  getScheduleTime(scheduleDateTime: string): string {
    let pos = scheduleDateTime.search(':');
    if (pos !== -1) {
      while (1) {
        pos = pos - 1;
        if (pos === 0 || scheduleDateTime[pos] === ' ') {
          break;
        }
      }

      return scheduleDateTime.substring(pos);
    }
    return '';
  }

  // Assumption this is only called when timer rolls over
  // this will never happen unless the user is sitting on the page
  getNextScheduleDay(scheduleDays: Array<string>): string {
    // if force time is not set then today will be used
    const today = parseInt(moment(this.forcedTime).format('d'), 10);
    const daysAsNumbers = scheduleDays.reduce((a, d) => {
      a[
        parseInt(
          moment()
            .day(d)
            .format('d'),
          10
        )
      ] = d;
      return a;
    }, {});

    let nextDay = '';
    const endOfWeek = 7;
    const startDay = today + 1;
    for (let d = 0; d < endOfWeek; d++) {
      const cur = (d + startDay) % 7;
      if (daysAsNumbers[cur]) {
        nextDay = daysAsNumbers[cur];
        break;
      }
    }
    return nextDay;
  }

  /**
   * Go through the classes and re-calculate the time remaining
   * until the first session starts and update the messaging on each
   * session accordingly
   */
  private refreshClassMessages(): boolean {
    if (!this.classes) {
      return false;
    }

    this.classes.forEach(klass => {
      const session = klass.firstSession;
      if (session) {
        session.statusStr = '';
        session.actionStr = '';
        session.canEnter = false;
        session.timeFrame = SessionTimeframe.Unknown;
        if (session.getIsOpenNow(this._forcedTime)) {
          // We can enter
          session.statusStr = 'Doors are open';
          session.actionStr = 'Come on in!';
          session.canEnter = true;
          session.isOpenNow = true;
          session.isToday = true;
          session.timeFrame = SessionTimeframe.Now;
          if (session.getIsInSession(this._forcedTime)) {
            session.isInSession = true;
            session.statusStr = 'Class has begun';
          }
        } else {
          // The session hasn't started yet.
          session.statusStr = 'Classroom is not open';
          const now: moment.Moment = this._forcedTime ? this._forcedTime.local() : moment();
          const timeMins = session.lobbyOpenTime.diff(now.valueOf(), 'minute');
          const timeMinsClose = session.lobbyCloseTime.diff(now.valueOf(), 'minute');
          /** when lobby is open */
          if (timeMins >= 1 && timeMins <= 60) {
            // If < 60 minutes until the doors open, then
            // show the time remaing
            session.isToday = true;
            session.actionStr = `Come back in ${timeMins} minute${timeMins === 1 ? '' : 's'}`;
            session.timeFrame = SessionTimeframe.Imminent;
            /** when session lobby close */
          } else if (timeMins < 1 && timeMinsClose < 1) {
            session.isToday = false;
            if (!session.isLast) {
              // figure out which day to display
              const schedulesInt: number[] = [];
              /** get schedule of the week with respect to startDate0Z and now */
              const schedules = klass.schedule.weekdays.map(weekday => {
                const day = parseInt(
                  moment()
                    .day(weekday)
                    .format('d'),
                  10
                );
                /** generate schedules with respect to scheduled days of the week and the current week */
                const sched = moment(klass.startDate0Z)
                  .tz(klass.schedule.startTime.tz)
                  .day(day % 7)
                  .startOf('day')
                  .add({
                    hour: klass.schedule.startTime.hour,
                    minutes: klass.schedule.startTime.mins
                  })
                  .add(now.isoWeek() - moment(klass.startDate0Z).isoWeek(), 'week')
                  .tz(moment.tz.guess());
                schedulesInt.push(Number.parseInt(sched.format('d'), 0));
                return sched;
              });
              const currentDayIndex = schedulesInt.findIndex(d => d === Number.parseInt(now.format('d'), 0));
              const nexSchedule = schedules[currentDayIndex + 1] || schedules[0];
              const nexScheduleStr = nexSchedule
                /** add another week if for next week */
                .add(currentDayIndex !== -1 && schedules[currentDayIndex + 1] !== undefined ? 0 : 1, 'week')
                .format('dddd, MMMM Do YYYY [at] h:mm a');
              session.statusStr = `Your next ${
                session.__t === 'ClassSession' ? 'class' : 'session'
              } is on ${nexScheduleStr}`;
              session.actionStr = `See you there`;
              session.timeFrame = SessionTimeframe.Future;
            } else {
              session.statusStr = null;
              session.actionStr = 'There are no more sessions for this class.';
              session.timeFrame = SessionTimeframe.Unknown;
            }
          } else {
            // More than 60 minutes.  We want to show the time of day to comback if today or tomorrow
            const timeOfDay = session.lobbyOpenTime.format('h:mm a');
            if (now.isSame(session.lobbyOpenTime, 'day')) {
              // It's later on today
              session.isToday = true;
              session.actionStr = 'Doors open at ' + timeOfDay;
              session.timeFrame = SessionTimeframe.Today;
            } else if (
              moment(now)
                .add(1, 'day')
                .isSame(session.lobbyOpenTime, 'day')
            ) {
              // It's tomorrow
              session.actionStr = 'Doors open tomorrow at ' + timeOfDay;
              session.timeFrame = SessionTimeframe.Tomorrow;
            } else {
              // It's beyond tomorrow
              session.statusStr =
                session.__t === 'ClassSession' ? 'The next class is scheduled for' : 'This session is scheduled for ';
              session.actionStr = session.scheduledStartTime.format('dddd, MMMM Do YYYY, h:mm a');
              session.timeFrame = SessionTimeframe.Future;
            }
          }
        }
      } // End, if (session)
    });
  }
}
