import * as momentTz from 'moment-timezone';
import { environment } from '@env/environment';
import { Logger } from '@app/core/logger.service';
import { extendMoment } from 'moment-range';
import { GenericSession, AdhocSession } from './session';
const moment = extendMoment(momentTz);

const log = new Logger('Sessions');

/**
 * A session that is associated with a regular Moving Together class
 */
export class ClassSession extends GenericSession {
  seq: 0;
  classId: '';

  /**
   * Construct a new ClassSession from an AdHoc session.  This allows the ClassSession to
   * act as a simple wrapper
   */
  static NewFromAdHocSession(session: AdhocSession): ClassSession {
    const classSession = new ClassSession(session);
    classSession.isForClass = false;
    classSession.isAdHoc = true;
    classSession.seq = 0;
    classSession.classId = '';
    return classSession;
  }

  constructor(initialValues: any = {}) {
    super(initialValues);
    this.isForClass = true;
  }
}

// Create lookup to go from short weekday names (in a schedule) to
// full weekday names
const weekdaysLong = moment.weekdays();
const weekdayLookup: string[] = [];
moment.weekdaysShort().forEach((day: string, index: number) => {
  weekdayLookup[day.toLocaleLowerCase()] = weekdaysLong[index];
});

export class ClassScheduleTime {
  hour: 12;
  mins: 0;
  tz: 'America/Los_Angeles';

  constructor(initialValues: any = {}) {
    Object.assign(this, initialValues);
  }
}

export class ClassSchedule {
  startTime: ClassScheduleTime;
  weekdays: string[];

  constructor(initialValues: any = {}) {
    Object.assign(this, initialValues);
  }

  /**
   * Get a user-friendly string to display weekdays
   */
  getWeekdaysStr(): string {
    // Convert first letter of each day to upper case and separate by ', '
    return this.weekdays.map(d => weekdayLookup[d.toLowerCase()] || d).join(', ');
  }

  /**
   * Human-friendly string to show the schedule.  Shows weekdays and time of day.
   */
  getScheduleStr(): string {
    const minsPadded = ('00' + this.startTime.mins).slice(-2); // Zero padded
    if (this.startTime.hour <= 12) {
      return this.getWeekdaysStr() + ' ' + this.startTime.hour + ':' + minsPadded + ' AM';
    } else {
      return this.getWeekdaysStr() + ' ' + (this.startTime.hour - 12) + ':' + minsPadded + ' PM';
    }
  }
}

/**
 * Class object + sessions initialized from an object returned from
 * the API
 */
export class ClassObject {
  _id: string;
  __v: number;
  name: string;
  acronym: string;
  durationMins: number;
  lobbyTimeMins: number;
  numSessions: number;
  capacity: number;
  sessions: ClassSession[];
  schedule: ClassSchedule;
  participants: string[];
  startDate0Z: string;
  courseId: string;
  instructorId: string;
  instructor: any; // JSON object with userInfo on the instructor

  // These are in addition to what comes from the API
  firstSession: ClassSession;
  scheduleStr = ''; // Daily schedule as a string

  /**
   * Convert a moment to a Class schedule object
   * @param on When a session occures
   * @param tz Timezone for the schedule
   */
  static MomentToSchedule(on: moment.Moment, tz: string): any {
    const onTz = moment(on).tz(tz);

    return {
      weekdays: [onTz.format('ddd').toLowerCase()],
      startTime: {
        hour: onTz.hours(),
        mins: onTz.minutes(),
        tz
      }
    };
  }

  /**
   * Construct a new ClassObject from an AdHoc session, allowing
   * it to be displayed along with session classes
   * @param session
   */
  static NewFromAdHocSession(session: AdhocSession): ClassObject {
    const classSession = ClassSession.NewFromAdHocSession(session);
    const classObj = new ClassObject({
      name: session.name,
      capacity: session.capacity,
      acronym: 'ClassFrom-' + session.acronym,
      durationMins: session.durationMins,
      lobbyTimeMins: session.lobbyTimeMins,
      numSessioms: 1,
      schedule: ClassObject.MomentToSchedule(session.scheduledStartTime, session.tz),
      participants: session.participants,
      startDate0Z: session.date0Z,
      courseId: '',
      instructorId: session.instructorId,
      instructor: session.instructor
    });
    classObj.sessions = [classSession];
    classObj.scheduleStr = classObj.schedule.getScheduleStr();
    classObj.firstSession = classSession;
    return classObj;
  }

  /**
   * Sort a list of classes in ascending order, according to the
   * lobby open time of their first session
   */
  static SortClassesByFirstSession(classes: ClassObject[]) {
    classes.sort((a, b): number => {
      if (a.sessions.length === 0 || b.sessions.length === 0) {
        return 1;
      }
      const aTime: moment.Moment = moment(a.sessions[0].lobbyOpenTime);
      const bTime: moment.Moment = moment(b.sessions[0].lobbyOpenTime);
      if (aTime.isBefore(bTime)) {
        return -1;
      } else if (aTime.isSame(bTime, 's')) {
        return 0;
      }
      return 1;
    });
    return classes;
  }

  constructor(initialValues: any = {}) {
    // tslint:disable-next-line: forin
    Object.keys(initialValues).forEach(prop => {
      switch (prop) {
        case 'sessions':
          this.sessions = initialValues[prop].map((session: any) => {
            return new ClassSession(session);
          });
          break;
        case 'schedule':
          this.schedule = new ClassSchedule(initialValues.schedule);
          break;

        default:
          this[prop] = initialValues[prop];
      }
    });
    this.firstSession = (this.sessions && this.sessions.length) > 0 ? this.sessions[0] : null;
    this.scheduleStr = this.schedule.getScheduleStr();
  }
}
