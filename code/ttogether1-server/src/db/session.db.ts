/**
 * Mongoose Schemas, Models, and Typescript Interfaces
 * for Session data stored in MongoDB
 *
 * See Interfaces for comments describing the objects
 *
 */
require('dotenv').config();
let moment = require('moment-timezone');
require('moment-recur');
import { User } from 'auth0';
import { extendMoment } from 'moment-range';
import mongoose, { Schema } from 'mongoose';
import { UserService } from '../av/user.service';
import { Logger } from '../core/logger.service';

moment = extendMoment(moment);
/* Which video provider? */
export enum VideoProvider {
    TOKBOX = 'TOKBOX',
    TWILIO = 'TWILIO',
    AGORA = 'AGORA',
    UNKNOWN = 'UNKNOWN',
}

const log = Logger.logger('SessionDB');

/**
 * Information that we need about all session types
 */
export const GenericSessionSchema = new Schema<GenericSession>({
    name: String,
    sessionType: String,
    acronym: String, // Used to name resources related to this session
    provider: String, // What video provider?  It will be Agora for the time being
    providerId: String, // Provider-specific identifier for the session (if any).  For example Twilio requires an assigned room
    instructorId: String, // Auth0 user id for the instructor who taught the particular session
    instructorData: Object,
    helpMessage: String,
    program: { type: String, trim: true, required: true },

    tz: String, // Local/Refernce Timezone
    date0Z: String, // Date when class starts in the local/reference timezone ('YYYY/MM/DD')
    durationMins: Number, // How long instruction lasts (usually 60 mins)

    // All of these times are global times
    scheduledStartTime: { type: Date }, // The nominal time that instruction starts in the TZ of the class
    scheduledEndTime: { type: Date }, // ScheduledStartTime + durationMins, in the TZ of the class
    lobbyOpenTime: { type: Date }, // Opening time of the lobby at the start of the session
    lobbyCloseTime: { type: Date }, // Closing time of the lobby at the end of the session
    lobbyTimeMins: Number, // How long the "lobby" is open before and after the class' schedule time

    createdOn: { type: Date, default: Date.now }, // When the record was first created

    disableEmails: {
        type: Boolean,
        default: false,
    },
});

GenericSessionSchema.index({ acronym: 1 }, { unique: true });

/**
 * A Session that is part of a class
 */
const ClassSessionSchema = new Schema({
    classId: String, // _id of the containing class
    seq: Number, // Sequence number, starting with 1
    disableEmails: {
        type: Boolean,
        default: false,
    },
});

/**
 * A Session that is not part of a class - could be scheduled, or ad-hoc
 */
const AdHocSessionSchema = new Schema({
    sessionType: String,
    description: String, // Verbose description of the reason for the session
    capacity: Number, // The maximum number of participants
    participants: [String], // IDs of Students currently enrolled, in order of assigned seating,
    notes: String,
});

/**
 * Various types of sessions
 */
// export enum SessionType {
//     Generic = 'g',
//     Scheduled = 's', // Scheduled, ad-hoc
//     Impromptu = 'o', // Impromptu (on-the-fly), not scheduled
//     Class = 'c', // Part of a class
// }

export enum AdHocSessionType {
    ResearchInformation = 'Research Information',
    TechCheck = 'Tech Check',
    MeetYourInstructor = 'Meet Your Instructor',
    Orientation = 'Orientation',
    StudySurvey = 'Study Survey',
    Support = 'Support',
}

export const adHocSessionTypes = new Map<AdHocSessionType, string>([
    [AdHocSessionType.ResearchInformation, 'Research Information'],
    [AdHocSessionType.TechCheck, 'Tech Check'],
    [AdHocSessionType.MeetYourInstructor, 'Meet Your Instructor'],
    [AdHocSessionType.Orientation, 'Orientation'],
    [AdHocSessionType.StudySurvey, 'Study Survey'],
    [AdHocSessionType.Support, 'Support'],
]);

export enum LegacyAdHocSessionType {
    Consent = 'Consent',
    TechAssess = 'TechAssess',
    GoalsAssess = 'GoalsAssess',
    StudyAssess = 'StudyAssess',
}

export const legacyAdHocSessionTypes = new Map<LegacyAdHocSessionType, string>([
    [LegacyAdHocSessionType.Consent, 'Research Information'],
    [LegacyAdHocSessionType.TechAssess, 'Tech Check'],
    [LegacyAdHocSessionType.GoalsAssess, 'Meet Your Instructor'],
    [LegacyAdHocSessionType.StudyAssess, 'Study Survey'],
]);

enum SessionType {
    ClassSession = 'ClassSession',
    AdHocSession = 'AdHocSession', // Scheduled, ad-hoc
    GenericSession = 'GenericSession', // Impromptu (on-the-fly), not scheduled
}
export default SessionType;

export interface GenericSession extends mongoose.Document {
    name: string;
    acronym: string;
    __t: SessionType;
    provider: VideoProvider;
    providerId: string;
    instructorId: string;
    date0Z: string;
    scheduledStartTime: Date;
    scheduledEndTime: Date;
    lobbyOpenTime: Date;
    lobbyCloseTime: Date;
    tz: string;
    lobbyTimeMins: Number;
    durationMins: Number;
    helpMessage: string;
    program: string; // acronym of program in programs table

    instructorData?: User; // User info for the instructor
    isOpenNow(now: any): boolean;
    opensAfterNow(now: any): boolean;
    inSession(now: any): boolean;
    setStartTime(
        startTime: Date,
        durationMins: Number,
        lobbyTimeMins: Number,
        tz: string
    ): void;
    addInstructorData(): Promise<User | undefined>;
}

export interface ClassSession extends GenericSession {
    classId: string; // _id of the containing class
    seq: Number; // Sequence number, starting with 1
    disableEmails?: boolean;
}

export interface AdHocSession extends GenericSession {
    sessionType: AdHocSessionType;
    description: string; // Verbose description of the reason for the session
    capacity: Number; // The maximum number of diads
    participants: string[]; // Students currently enrolled, in order of assigned seating
    notes?: string;
}

/**
 * Determine if the session is currently open.  It is
 * open if the lobby is open.
 *
 * @param now Time to use as the current time instead of now
 */
GenericSessionSchema.methods.isOpenNow = function (
    now: any = moment()
): boolean {
    return moment
        .range(this.lobbyOpenTime, this.lobbyCloseTime)
        .contains(now.utc());
};

/**
 * Determine if the session opens after now.  It is
 * open if the lobby is open.
 *
 * @param now Time (moment) to use as the current time instead of now
 */
GenericSessionSchema.methods.opensAfterNow = function (
    now: any = moment()
): boolean {
    return now.utc().isBefore(this.lobbyOpenTime);
};

/**
 * Determine if the session is currently in session (within its
 * scheduled time)
 *
 * @param now Time to use as the current time instead of now
 */
GenericSessionSchema.methods.inSession = function (
    now: any = moment()
): boolean {
    return moment
        .range(this.scheduledStartTime, this.scheduledEndTime)
        .contains(now.utc());
};

GenericSessionSchema.virtual('startTime').get(() => {}); // Calculated from start time and lobby time
GenericSessionSchema.virtual('endTime').get(() => {}); // Calculated from start time, duration, lobby time
GenericSessionSchema.virtual('state').get(() => {}); // Calculated from start time, duration, lobby time, and current time

/**
 * Set the start time and related time fields of a session, based on its start time
 *
 * @param startTime   Global/absolute time when the session is to start
 * @param durationMins How long the session should last, in minutes
 * @param lobbyTimeMins How long for the lobby (before and after the session), zero for none
 * @param tz Timezone in which the session takes place (see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
 */
GenericSessionSchema.methods.setStartTime = function (
    startTime: Date,
    durationMins: number,
    lobbyTimeMins: number,
    tz: string
) {
    this.tz = tz;
    const start = moment(startTime).utc();
    this.date0Z = moment(startTime).tz(tz).format('YYYY-MM-DD');
    this.lobbyTimeMins = lobbyTimeMins;
    this.durationMins = durationMins;

    this.scheduledStartTime = start.toDate();
    this.lobbyOpenTime =
        lobbyTimeMins === 0
            ? start.toDate()
            : moment(start).subtract(lobbyTimeMins, 'm');
    this.scheduledEndTime = moment(start).add(durationMins, 'm');
    this.lobbyCloseTime =
        lobbyTimeMins === 0
            ? this.scheduledEndTime
            : moment(start).add(durationMins + lobbyTimeMins, 'm');
};

/**
 * Enriches the session with intructor data
 */
GenericSessionSchema.methods.addInstructorData = async function (): Promise<
    User | undefined
> {
    if (this.instructorId) {
        const id = await UserService.getAuth0UsersByIds([this.instructorId]);
        this.instructorData = id && id.length > 0 ? id[0] : undefined;
    }

    return this.instructorData;
};

/**
 * User Mongoose descriminators to define class inheritance
 */
export const GenericSessionModel = mongoose.model<GenericSession>(
    'session',
    GenericSessionSchema
);
export const AdHocSessionModel =
    GenericSessionModel.discriminator<AdHocSession>(
        'AdHocSession',
        AdHocSessionSchema
    );
export const ClassSessionModel =
    GenericSessionModel.discriminator<ClassSession>(
        'ClassSession',
        ClassSessionSchema
    );
