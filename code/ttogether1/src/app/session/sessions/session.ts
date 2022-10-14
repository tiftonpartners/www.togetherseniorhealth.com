import * as momentTz from 'moment-timezone';
import { environment } from '@env/environment';
import { Logger } from '@app/core/logger.service';
import { extendMoment } from 'moment-range';
import { VideoOptimizationMode } from '@app/shared/services/agora/agora.types';

const moment = extendMoment(momentTz);

const log = new Logger('Sessions');

moment.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: 'a few seconds',
    ss: '%d seconds',
    m: '1 minute',
    mm: '%d minutes',
    h: '1 hour',
    hh: '%d hours',
    d: '1 day',
    dd: '%d days',
    w: '1 week',
    // ww: '%d weeks',
    M: '1 month',
    MM: '%d months',
    y: '1 year',
    yy: '%d years'
  }
});

// scheduledStartTime: "2020-10-09T17:30:00.000Z"
// scheduledEndTime: "2020-10-09T18:30:00.000Z"

export class Instructor {
  email = '';
  name = '';
  nickname = '';
  picture = '';
  user_id = '';
  username = '';

  constructor(initialValues: any = {}) {
    Object.assign(this, initialValues);
  }
}

// How soon is the session relative to now?
export enum SessionTimeframe {
  Unknown = -1,
  Now = 0, // Come on in!
  Imminent = 1, // Very soon; within an hour
  Today = 2, // Not so soon, later on today
  Tomorrow = 3, // Tomorrow
  Future = 4 // After tomorrow
}

/**
 * Generic session object contains a superset of the values
 * for class and adhoc sessions, plus utilities to calculate
 * session status based on dates
 */
export class GenericSession {
  // These fields come driectly from the API
  _id = '';
  __t = 'GenericSession';
  name: string;
  acronym: string;
  provider: string;
  providerId: string;
  instructorId: string;
  date0Z: string;
  scheduledStartTime: moment.Moment;
  scheduledEndTime: moment.Moment;
  lobbyOpenTime: moment.Moment;
  lobbyCloseTime: moment.Moment;
  tz: string;
  lobbyTimeMins: number;
  durationMins: number;
  videoOptimizationMode: VideoOptimizationMode;

  // These fields are added for our use
  // Information about the instructor
  instructor: Instructor;
  // Status is updated from calculations
  isLast = false;
  isInSession = false;
  isOpenNow = false;
  isToday = false;
  statusStr = '';
  actionStr = '';
  canEnter = false;
  timeFrame = SessionTimeframe.Unknown;
  // These properties make it easy to tell the
  // subclass type
  isForClass = false;
  isAdHoc = false;

  constructor(initialValues: any = {}) {
    Object.keys(initialValues).forEach(prop => {
      if (prop.toLowerCase().endsWith('time')) {
        this[prop] = moment(initialValues[prop]);
      } else if (prop === 'instructor') {
        this[prop] = new Instructor(initialValues[prop]);
      } else {
        this[prop] = initialValues[prop];
      }
    });
  }

  /**
   * Determine if the session is currently open.  It is
   * open if the lobby is open or it is in session.
   *
   * @param now Time to use as the current time instead of now
   */
  getIsOpenNow(now?: moment.Moment): boolean {
    const n = now || moment();
    return moment.range(this.lobbyOpenTime, this.lobbyCloseTime).contains(n);
  }

  /**
   * Determine if the session is currently in session (within its
   * scheduled time)
   *
   * @param now Time to use as the current time instead of now
   */
  getIsInSession(now?: moment.Moment): boolean {
    const n = now || moment();
    return moment.range(this.scheduledStartTime, this.scheduledEndTime).contains(n);
  }

  /**
   * Is the session today?
   */
  getIsToday(now?: moment.Moment): boolean {
    const n = now || moment();
    return this.scheduledStartTime.isSame(n, 'day');
  }

  /**
   * Is this a valid Session?
   */
  isValid(): boolean {
    return this._id && this._id.length > 0;
  }
}

/**
 * A session NOT associated with a regular Moving Together class.
 */
export class AdhocSession extends GenericSession {
  description: string;
  capacity: number;
  participants: string[];

  constructor(initialValues: any = {}) {
    super(initialValues);
    this.isAdHoc = true;
  }
}
