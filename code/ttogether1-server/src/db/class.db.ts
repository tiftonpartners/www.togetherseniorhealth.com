/**
 * Mongoose Schemas, Models, and Typescript Interfaces
 * for Course, Class and ClassSession data stored in
 * MongoDB
 *
 * See Interfaces for comments describing the objects
 *
 */
import { ObjectId } from 'mongodb';
import mongoose, { Schema } from 'mongoose';
import { ClassSession, ClassSessionModel } from './session.db';

import { UserInfo } from '../av/user.service';
import { User } from 'auth0';

import { extendMoment } from 'moment-range';

let moment = require('moment-timezone');
moment = extendMoment(moment);
require('moment-recur');
import { Moment } from 'moment-timezone';
import { Logger } from '../core/logger.service';

require('dotenv').config();

/* Which video provider? */
export enum VideoProvider {
    TOKBOX = 'TOKBOX',
    TWILIO = 'TWILIO',
    AGORA = 'AGORA',
    UNKNOWN = 'UNKNOWN',
}

const log = Logger.logger('ClassDb');

const ScheduleSchema = new Schema({
    weekdays: [
        {
            type: String,
            enum: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
        },
    ], // Weekdays class is typically held
    startTime: { hour: Number, mins: Number, tz: String }, // The nominal time of day that instruction starts, including timezone
});

/**
 * A Class is a teaching of a Course as a sequence of sessions and
 * on a particular schedule
 */
const ClassSchema = new Schema<ClassDoc>({
    name: String,
    description: String,
    acronym: String, // Used to name resources related to this class
    createdOn: { type: Date, default: Date.now }, // When the record was first created
    schedule: ScheduleSchema, // Pattern for scheduling the class
    startDate0Z: String, // Date when class starts ('YYYY/MM/DD')
    waitlisting: Boolean, // Are we accepting waitlists for this class?
    open: Boolean, // Is the class open for enrollment?
    durationMins: Number, // ScheduledStartTime + durationMins
    lobbyTimeMins: Number, // Duration of lobby time before/after instruction
    numSessions: Number, // Number of sessions, usually 24
    courseId: ObjectId, // The associated course
    capacity: Number, // The maximum number of diads
    instructorId: String, // Auth0 ID of the instructor for the class
    instructorData: Object,
    participants: [String], // Students currently enrolled, in order of assigned seating
    sessions: [ClassSessionModel.schema],
    helpMessage: String,
    checkPageHelpMessage: String,
    program: {
        type: String,
        trim: true,
        required: true,
    },
    disableEmails: {
        type: Boolean,
        default: false,
    },
});

/**
 * The lifecycle of a class
 */
export enum ClassState {
    Hold = 'hold', // Class is visible, but not open for enrollment
    Open = 'open', // Currently open and available for enrollment; no sessions have started
    InProgress = 'inprog', // At least the first session has started
    Completed = 'done', // The last session has completed
}

/**
 * Given a moment for a date in UTC (hour,min,sec = 0), and a schedule (hour, mins, and timezone),
 * convert the UTC date to a date/time in the time zone and time-of-day of the schedule and return a moment
 * with the value
 * @param date0Z - starting day
 * @param startTime - Moment with h,m,s=0
 */
export function getLocalTimeFrom0Z(
    date0Z: string,
    startTime: TimeOfDay
): Moment {
    const mnt = moment(date0Z).utc();

    return moment.tz(
        [mnt.year(), mnt.month(), mnt.date(), startTime.hour, startTime.mins],
        startTime.tz
    );
}

/**
 * Given a moment for a date in UTC (hour,min,sec = 0), and a schedule (hour, mins, and timezone),
 * get a recurrence of dates by the local time
 * @param dateTime - starting day
 * @param schedule Schedule giving time-of-day and weekly re-occurence
 * @param startOnDay Should the recurring schedule start on the day passed if applicable
 */
export function getLocalTimeRecurrence(
    dateTime: string,
    schedule: Schedule,
    startOnDay: boolean = false
) {
    const localTime = getLocalTimeFrom0Z(dateTime, schedule.startTime);
    // @ts-ignore
    const recurrence = localTime.recur().every(schedule.weekdays).daysOfWeek();
    if (recurrence.matches(localTime) && !startOnDay) {
        const start = localTime.subtract(1, 'd');
        recurrence.fromDate(start);
    }

    return recurrence;
}

/**
 * Given a class and moment time object, calculate datetime properties necessary
 * for a session. A TimeOfDay object can be passed to override the classes default
 * schedule. This is primarily used when editing a specific session.
 * @param klass - the class to change
 * @param mnt Moment with h,m,s=0
 * @param startTime Object to override specific time for this session
 */
export function getUpdatedDateTimes(
    klass: Class,
    mnt: Moment,
    startTime?: TimeOfDay
): {
    date0Z: string;
    start: string;
    end: string;
    lobbyOpen: string;
    lobbyClose: string;
} {
    const start = getLocalTimeFrom0Z(
        mnt.toISOString(),
        startTime || klass.schedule.startTime
    );
    const lobbyOpen = moment(start)
        .subtract(klass.lobbyTimeMins, 'm')
        .toISOString();
    const end = moment(start).add(klass.durationMins, 'm').toISOString();
    const lobbyClose = moment(end).add(klass.lobbyTimeMins, 'm').toISOString();

    return {
        date0Z: start.format('YYYY-MM-DD'),
        start: start.toISOString(),
        end,
        lobbyOpen,
        lobbyClose,
    };
}

/**
 * Given date and time objects, combine to one timestamp that reflects both
 * @param date0Z Date string that will be used for year/month/day
 * @param startTime Time string that will be used for hours/mins
 */
export function combineDateTime(date0Z: string, startTime: string): Moment {
    const start = moment(startTime).utc();
    return moment(date0Z).startOf('day').set({
        hour: start.hour(),
        minute: start.minute(),
    });
}

/**
 * This class method will builds all of the sessions for a Class,
 * given the class' schedule.
 *
 * WARNING: This will delete any existing Sessions!
 */
ClassSchema.methods.buildSessionsFromSchedule = async function () {
    // Calculate dates for each session, based on the class schedule
    // TODO: Account for holidays
    const klass = this as ClassDoc;

    // schedule based on local timezone to match expected days of week
    // everything gets saved back as UTC time
    const recurrence = getLocalTimeRecurrence(
        klass.startDate0Z,
        klass.schedule
    );

    const nextDates = recurrence.next(klass.numSessions);
    let i = 0;
    let sessions: ClassSession[] = [];
    // ***** For each session
    for (const m of nextDates) {
        i++;

        const { date0Z, start, end, lobbyClose, lobbyOpen } =
            getUpdatedDateTimes(klass, m);
        // log.info('Class Starts:', start.format(), 'Ends:', end.format())

        const session = new ClassSessionModel();
        const mStr = m.format('YYMMDD');
        const sampleSession = {
            name: `${klass.name}, Session ${i}`,
            acronym: `${klass.acronym}-${mStr}`,
            classId: klass._id,
            seq: i,
            provider: VideoProvider.AGORA,
            providerId: `${klass.acronym}-${mStr}`,
            date0Z,
            scheduledStartTime: start,
            scheduledEndTime: end,
            lobbyOpenTime: lobbyOpen,
            lobbyCloseTime: lobbyClose,
            tz: klass.schedule.startTime.tz,
            lobbyTimeMins: klass.lobbyTimeMins,
            durationMins: klass.durationMins,
            instructorId: klass.instructorId,
            helpMessage: klass.helpMessage,
            program: klass.program,
        };
        Object.assign(session, sampleSession);
        sessions.push(session as ClassSession);
    } // End, for each session
    klass.sessions = sessions;
    return;
};

/**
 * Updates sessions seq and name when one session's start date is updated
 */
ClassSchema.methods.reorderSessionsByStartDate = async function () {
    const klass = this as Class;

    const sessionsOrdered = klass.sessions.sort((a, b) => {
        const aDate = moment(a.date0Z);
        const bDate = moment(b.date0Z);
        if (aDate.isBefore(bDate)) {
            return -1;
        }

        if (aDate.isAfter(bDate)) {
            return 1;
        }

        return 0;
    });

    sessionsOrdered.map((session, i) => {
        const mStr = moment(session.date0Z).format('YYMMDD');

        session.seq = i + 1;
        session.name = `${klass.name}, Session ${i + 1}`;
        session.acronym = `${klass.acronym}-${mStr}`;
    });

    klass.sessions = sessionsOrdered;
};

/**
 * Find the next upcoming session
 *
 * @returns The next upcoming session, null if is none
 */
ClassSchema.methods.getNextUpcomingSession = function (): ClassSession | null {
    let closest: ClassSession | null = null;
    const today = moment();

    this.sessions.map((session) => {
        if (today.isBefore(moment(session.date0Z))) {
            if (!closest) {
                closest = session;
            } else if (
                today.diff(moment(closest.date0Z), 'days') <
                today.diff(moment(session.date0Z), 'days')
            ) {
                closest = session;
            }
        }
    });

    return closest;
};

/**
 * Updates all properties of a session date and time
 */
ClassSchema.methods.updateSessionDateTime = function (
    sessionAcronym: string,
    mnt: Moment,
    startTime?: TimeOfDay
) {
    const klass = this as Class;
    let session = klass.sessions.find(
        (session) => session.acronym === sessionAcronym
    );
    const { date0Z, start, end, lobbyClose, lobbyOpen } = getUpdatedDateTimes(
        klass,
        mnt,
        startTime
    );

    if (session) {
        session.date0Z = date0Z;
        session.scheduledStartTime = start as any;
        session.scheduledEndTime = end as any;
        session.lobbyOpenTime = lobbyOpen as any;
        session.lobbyCloseTime = lobbyClose as any;
    }

    return session;
};

/**
 * Skips session and puts it at end of sequence
 */
ClassSchema.methods.skipSession = async function (sessionAcronym: string) {
    const klass = this as Class;
    const lastSession = klass.sessions[klass.sessions.length - 1];
    const skippedSession = klass.sessions.find(
        (session) => session.acronym === sessionAcronym
    );

    const recurrence = getLocalTimeRecurrence(
        moment(lastSession.date0Z),
        klass.schedule,
        true
    );

    if (skippedSession) {
        const nextDate = recurrence.next(1)[0] as Moment;
        // combine time with new date to not lose updated time values
        const finalDateTime = combineDateTime(
            nextDate.toISOString(),
            skippedSession.scheduledStartTime.toISOString()
        );
        const tz = skippedSession.tz || klass.schedule.startTime.tz;

        this.updateSessionDateTime(skippedSession.acronym, nextDate, {
            hour: finalDateTime.tz(tz).hour(),
            mins: finalDateTime.tz(tz).minute(),
            tz,
        });
        this.reorderSessionsByStartDate();
    }
};

/**
 * Delete session and renumber others
 */
ClassSchema.methods.deleteSession = async function (sessionAcronym: string) {
    const klass = this as Class;
    const otherSessions = klass.sessions.filter(
        (session) => session.acronym !== sessionAcronym
    );

    if (otherSessions) {
        klass.numSessions = otherSessions.length;
        klass.sessions = otherSessions;
        this.reorderSessionsByStartDate();
    }
};

/**
 * Updates instructor if current instructor is same as previous one at class level
 */
ClassSchema.methods.updateInstructor = async function (
    oldInstructor: string,
    newInstructor: string
) {
    const klass = this as Class;
    klass.sessions.map((session) => {
        if (session.instructorId === oldInstructor) {
            session.instructorId = newInstructor;
        }
    });
};

/**
 * Adds participant to class
 */
ClassSchema.methods.addParticipant = async function (userId: string) {
    const klass = this as Class;
    if (!klass.participants.includes(userId)) {
        klass.participants.push(userId);
        return true;
    }

    return false;
};

/**
 * Removes participant from class
 */
ClassSchema.methods.removeParticipant = async function (userId: string) {
    const klass = this as Class;
    const index = klass.participants.indexOf(userId);
    if (index > -1) {
        klass.participants.splice(index, 1);
    }
};

/**
 * Filter the sessions that match a given date and return those remaining
 *
 * @param dateStr String in the format 'YYYY-MM-DD'
 */
ClassSchema.methods.filterSessionsByDate = function (dateStr: string) {
    const remaining = this.sessions.filter((s: ClassSession) => {
        return s.date0Z === dateStr;
    });
    this.sessions = remaining;
};

/**
 * Filter the sessions that are assigned to the given instructor
 *
 * @param instructorId Auth0 identifier for the instructor
 */
ClassSchema.methods.filterSessionsByInstructor = function (
    instructorId: string
) {
    this.sessions = this.sessions.filter((s: ClassSession) => {
        return s.instructorId === instructorId;
    });
};

/**
 * Filter the sessions that start within the number of hours given
 *
 * @param hoursFromNow Number of hours of interest
 * @param now Time to use as the current time instead of now (moment)
 */
ClassSchema.methods.filterSessionsOpenSoon = function (
    hoursFromNow: number,
    now: any
) {
    const end = moment(now).add(hoursFromNow, 'h');
    log.debug('(filterSessionsOpenSoon) when:', end);
    this.sessions = this.sessions.filter((s: ClassSession) => {
        return moment.range(now, end).contains(s.scheduledStartTime);
    });
};

/**
 * Filter the sessions that are currently open (lobby is open)
 *
 * @param now Time to use as the current time instead of now
 */
ClassSchema.methods.filterSessionsOpenNow = function (now: any) {
    this.sessions = this.sessions.filter((s: ClassSession) => {
        // @ts-ignore
        return s.isOpenNow(now);
    });
};

/**
 * Filter all but the next "upcomming" session.  This is the session
 * that is currently under way, or otherwise the next session.
 *
 * This assumes that the sessions are sorted in order of ascending start time
 *
 * @param now Time to use as the current time instead of now
 */
ClassSchema.methods.filterSessionsUpcomming = function (now: moment.Moment) {
    const match = this.sessions.find((s: ClassSession) => {
        // @ts-ignore
        if (s.isOpenNow(now) || s.opensAfterNow(now)) {
            return true;
        }
    });
    this.sessions = match
        ? new Array<ClassSession>(match)
        : new Array<ClassSession>();
};

/**
 * Determine if the user is an instructor of the class.  This is true
 * if they are the primary instructor, or are assigned to
 * instruct any session
 *
 * @param userId - id of the user to check against
 */
ClassSchema.methods.isAnInstructor = function (userId: string): boolean {
    if (this.instructorId == userId) return true;
    let found = false;
    this.sessions.forEach((s: ClassSession) => {
        if (s.instructorId == userId) {
            found = true;
        }
    });
    return found;
};

/**
 * Filter the sessions that are currently in Session
 *
 * @param now Time to use as the current time instead of now
 */
ClassSchema.methods.filterSessionsInSession = function (now = moment()) {
    this.sessions = this.sessions.filter((s: ClassSession) => {
        // @ts-ignore
        return s.inSession(now);
    });
};

/**
 * Filter the session that has a given acronym
 *
 * @param acronym Acronym of the session of interest
 * @param now Time to use as the current time instead of now
 */
ClassSchema.methods.filterSessionsByAcronym = function (acronym: string) {
    this.sessions = this.sessions.filter((s: ClassSession) => {
        // @ts-ignore
        return s.acronym === acronym;
    });
};

/**
 * Find  the session that has a given acronym
 *
 * @param acronym Acronym of the session of interest
 * @returns The modified session object, or null if not found
 */
ClassSchema.methods.findSessionByAcronym = function (
    acronym: string
): ClassSession | null {
    for (const s of this.sessions) {
        // @ts-ignore
        if (s.acronym === acronym) return s;
    }
    return null;
};

ClassSchema.index({ acronym: 1 }, { unique: true });
ClassSchema.index({ 'sessions.acronym': 1 });
ClassSchema.index({ 'sessions.lobbyCloseTime': 1 });
ClassSchema.index({ participants: 1, 'sessions.lobbyOpenTime': 1 });
ClassSchema.index({ instructorId: 1, 'sessions.lobbyOpenTime': 1 });
ClassSchema.index({ 'sessions.instructorId': 1, 'sessions.lobbyOpenTime': 1 });

export const CLASS_COLLECTION = 'classes';
export const ClassModel = mongoose.model<ClassDoc>('class', ClassSchema);

/**
 * Season of the year, used to describe timeframe for the
 * opening of a class
 */
export enum Season {
    Spring = 'spring',
    Summer = 'summer',
    Fall = 'fall',
    Winder = 'winter',
}

/**
 * Time of day for a class or session
 */
export interface TimeOfDay {
    hour: Number;
    mins: Number;
    tz: string;
}

/**
 * The repeating schedule that define the repeating pattern of the
 * sessions of a class.  This is expressed as the weekdays and time of day
 */
export interface Schedule {
    weekdays: string[]; // Weekdays class is typically held
    startTime: TimeOfDay; // The nominal time of day that instruction starts, including timezone
}

/**
 * A Class is a sequence of sessions with an instructor and
 * list of participants, held at a specific time
 */
export interface Class {
    name: string;
    description: string;
    acronym: string; // Used to name resources related to this class
    createdOn: Date; // When the record was first created
    schedule: Schedule; // Pattern for scheduling the class
    startDate0Z: string; // Date when class starts (h,m,s=0 TZ=Z)
    tz: string; // Timezone in which it is held
    waitlisting: Boolean; // Are we accepting waitlists for this class?
    open: Boolean; // Is the class open for enrollment?
    durationMins: Number; // ScheduledStartTime + durationMins
    lobbyTimeMins: Number; // Duration of lobby time before/after instruction
    numSessions: Number; // Number of sessions, usually 24
    courseId: ObjectId; // The associated course
    courseName?: string;
    capacity: Number; // The maximum number of diads
    instructorId: string; // Auth0 ID of the instructor for the class
    instructor: UserInfo | undefined; // Information about the instructor, if loaded separately from Auth0
    instructorData?: User; // Used when expand is used to get Auth0 user info
    participants: string[]; // Students currently enrolled, in order of assigned seating
    participantsData?: User[]; // Used when expand is used to get Auth0 user info
    sessions: ClassSession[];
    helpMessage: string;
    checkPageHelpMessage: string;
    program: string;
    disableEmails?: boolean;

    filterSessionsByAcronym(acronym: string): void;
    findSessionByAcronym(acronym: string): ClassSession | null;
    filterSessionsByDate(dateStr: string): void;
    filterSessionsByInstructor(instructorId: string): void;
    filterSessionsOpenSoon(hoursFromNow: number, now: any): void;
    filterSessionsOpenNow(now: any): void;
    filterSessionsUpcomming(now: moment.Moment): void;
    isAnInstructor(userId: string): boolean;
    filterSessionsInSession(now: any): void;
    buildSessionsFromSchedule(): Promise<void>;
    reorderSessionsByStartDate(): Promise<void>;
    updateSessionDateTime(
        sessionAcronym: string,
        mnt: Moment,
        startTime?: TimeOfDay
    ): ClassSession | undefined;
    getNextUpcomingSession(): ClassSession | null;
    skipSession(sessionAcronym: string): Promise<void>;
    deleteSession(sessionAcronym: string): Promise<void>;
    addParticipant(userId: string): Promise<boolean>;
    removeParticipant(userId: string): Promise<void>;
    updateInstructor(
        oldInstructor: string,
        newInstructor: string
    ): Promise<void>;
}

export interface ClassDoc extends Class, mongoose.Document {}
