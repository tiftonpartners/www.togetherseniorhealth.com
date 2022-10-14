require('dotenv').config();
var crypto = require('crypto');
var base64url = require('base64url');
import SessionType, {
    AdHocSession,
    AdHocSessionModel,
    AdHocSessionType,
    VideoProvider,
} from '../db/session.db';
const moment = require('moment-timezone');

import { Logger } from '../core/logger.service';
import { of } from 'rxjs';
import { AVUserModel } from '../db/user.db';
import { UserInfo } from '../av/user.service';
import { Moment } from 'moment';
import { NotificationService } from './notification.service';
import { EmailType } from '../db/email-ledger.db';

const log = Logger.logger('SessionsService');
/**
 * Provides additional functionality for Ad-hoc Sessions
 */
export class AdHocSessionService {
    /**
     * Get adhoc session by acronym.
     *
     * @param acronym
     */
    static async getAdhocSession(
        acronym: string
    ): Promise<AdHocSession | null> {
        const query = { acronym };
        return AdHocSessionModel.findOne(query);
    }

    /**
     * Get all ad hoc sessions
     *
     * @param userInfo Authenticated user info
     * @param program Program to filter by
     */
    static async getAllAdhocSessions(
        userInfo: UserInfo,
        program?: string
    ): Promise<AdHocSession[] | null> {
        return AdHocSessionModel.find({
            ...userInfo.getProgramsQuery(program),
        }).sort({ lobbyOpenTime: 1 });
    }

    /**
     * Get all adhoc sessions after the current time for a specific user, sorted by
     * ascending start time.
     *
     * @param userId User of interest
     * @param now Moment to use for the current time; defaults to now but settable for testing
     */
    static async getUpcomingSessions(
        userId: string,
        now: Moment = moment()
    ): Promise<AdHocSession[]> {
        const query = {
            $and: [
                { lobbyCloseTime: { $gte: now.toDate() } },
                {
                    $or: [{ participants: userId }, { instructorId: userId }],
                },
            ],
        };
        return AdHocSessionModel.find(query).sort({ lobbyOpenTime: 1 });
    }

    /**
     * Get all adhoc sessions after the current time and before the end of that day
     * for all users, sorted by ascending start time.
     *
     * @param now Moment to use for the current time; defaults to now but settable for testing
     */
    static async getAllUpcomingSessionsToday(
        now: any = moment()
    ): Promise<AdHocSession[]> {
        const query = {
            $and: [
                { lobbyOpenTime: { $gte: now.toDate() } },
                { lobbyCloseTime: { $lte: now.add(1, 'day').toDate() } },
            ],
        };
        return AdHocSessionModel.find(query).sort({ lobbyOpenTime: 1 });
    }

    /**
     * Get all adhoc sessions over a specific timerange and user
     *
     * @param userId User of interest
     * @param start Moment to use for the beginning of the range
     * @param end Moment to use for the beginning of the range
     */
    static async getSessionScheduleForUser(
        userId: string,
        start: any,
        end: any
    ): Promise<AdHocSession[]> {
        const query = {
            $and: [
                { lobbyOpenTime: { $gte: start.toDate() } },
                { lobbyCloseTime: { $lte: end.toDate() } },
                {
                    $or: [{ participants: userId }, { instructorId: userId }],
                },
            ],
        };
        return AdHocSessionModel.find(query).sort({ lobbyOpenTime: 1 });
    }

    /**
     * Get all adhoc sessions over a specific timerange
     *
     * @param userInfo UserInfo for the authenticated user
     * @param start Moment to use for the beginning of the range
     * @param end Moment to use for the beginning of the range
     * @param sessionType Filter based on sessionType value
     * @param userId User ID to search based on
     * @param program Selected program acronym to filter on
     */
    static async getSessionSchedule(
        userInfo: UserInfo,
        start: moment.Moment,
        end: moment.Moment,
        sessionType = '',
        userId?: string,
        program?: string
    ): Promise<AdHocSession[]> {
        let query: { $and: any };
        if (sessionType && sessionType.length > 0) {
            query = {
                $and: [
                    { lobbyOpenTime: { $gte: start.toDate() } },
                    { lobbyCloseTime: { $lte: end.toDate() } },
                    { sessionType: sessionType },
                ],
            };
        } else {
            query = {
                $and: [
                    { lobbyOpenTime: { $gte: start.toDate() } },
                    { lobbyCloseTime: { $lte: end.toDate() } },
                ],
            };
        }

        if (userId) {
            query['$and'].push({
                $or: [{ participants: userId }, { instructorId: userId }],
            });
        }

        if (userInfo) {
            query = {
                ...query,
                ...userInfo.getProgramsQuery(program),
            };
        } else {
            throw new Error('No user info found');
        }
        return AdHocSessionModel.find(query).sort({ lobbyOpenTime: 1 });
    }

    /**
     * Round a start time to a 15 minute time slot
     *
     * @param startTime (moment)
     * @returns a moment containing the new start time.  Mins, secs, and msecs will all be zero
     */
    static roundStartTime(startTime: moment.Moment): any {
        const duration = +moment.duration(15, 'm'); // Time slot length
        return moment(Math.floor(+startTime / duration) * duration);
    }

    /**
     * Round a duration to up to the next whole 15 minute interval
     * @param durationMins Desired duration, in minutes
     */
    static roundDuration(durationMins: number): number {
        return durationMins <= 0 ? 15 : Math.ceil(durationMins / 15) * 15;
    }

    /**
     * Schedule a new ad-hoc session.  Start time and duration are rounded to 15 minute
     * time slots.
     *
     * @param name: User-friently name for the session
     * @param sessionType Type of the session we are looking for
     * @param tz used timezone
     * @param instructorId: user Id of the person acting as instructor
     * @param durationMins: Duration of the session, rounded UP to the next 15 minutes
     * @param startTime: (moment) when the session is to start.  Times are adjusted to the start of the 15
     *      minute interval proceeding the session
     * @param participants array of session participants
     * @param notes optional notes to add
     * @param sendEmail optional flag to send reminder emails
     */
    static async scheduleSession(
        name: string,
        sessionType: AdHocSessionType,
        startTime: Moment,
        tz: string,
        durationMins: number,
        instructorId: string,
        participants: string[],
        notes?: string,
        sendEmail?: boolean
    ): Promise<AdHocSession> {
        let session = new AdHocSessionModel() as AdHocSession;
        const actualStart =
            AdHocSessionService.roundStartTime(startTime).toDate();

        // Sessions are spaced 1 hour apart
        session.setStartTime(
            actualStart,
            AdHocSessionService.roundDuration(durationMins),
            0,
            tz
        );
        const acronym = base64url(crypto.randomBytes(16));

        participants = participants.filter((userId) => userId !== instructorId);

        if (participants.length === 0) {
            throw 'No particpants for session';
        }

        const participant = await AVUserModel.findOne({
            userId: participants[0],
        });

        const vals = {
            name: name,
            acronym: acronym,
            sessionType,
            provider: VideoProvider.AGORA,
            providerId: acronym,
            instructorId: instructorId,
            description: name + ' (Scheduled on ' + new Date() + ')',
            capacity: 8,
            participants,
            program: participant ? participant.program : 'OTHER',
            notes,
        };
        Object.assign(session, vals);
        await session.save();

        // if selected, send email to each participant
        if (session && sendEmail) {
            for (let i = 0; i < participants.length; i++) {
                await NotificationService.sendNotification({
                    emailType: EmailType.MeetNowAdHocSessionReminder,
                    data: {
                        userId: participants[i],
                        sessionAcronym: session.acronym,
                    },
                });
            }
        }

        return session;
    }

    /**
     * Reschedule an existing session.
     *
     * @param acronym Acronym for the session
     * @param payload: New values for the session, at least name and startTime
     */
    static async rescheduleSession(
        acronym: string,
        startTime: moment.Moment,
        name?: string,
        sessionType?: AdHocSessionType,
        tz?: string,
        instructorId?: string,
        participants?: string[],
        duration?: number,
        notes?: string,
        sendEmail?: boolean
    ): Promise<AdHocSession | null> {
        // @ts-ignore
        const session: AdHocSession = await AdHocSessionModel.findOne({
            acronym: acronym,
        });
        duration = duration
            ? AdHocSessionService.roundDuration(duration)
            : undefined;
        if (session) {
            const actualStart =
                AdHocSessionService.roundStartTime(startTime).toDate();
            session.setStartTime(
                actualStart,
                duration || session.durationMins,
                0,
                tz || session.tz
            );
            session.instructorId = instructorId || session.instructorId;
            if (sessionType) {
                session.sessionType = sessionType;
            }

            if (name) {
                session.name = name;
            }
            if (participants && participants.length > 0) {
                session.participants = participants.filter(
                    (userId) => userId !== session.instructorId
                );
            }
            if (notes) {
                session.notes = notes;
            }

            await session.save();

            // if selected, send email to each participant
            if (sendEmail) {
                for (let i = 0; i < session.participants.length; i++) {
                    await NotificationService.sendNotification({
                        emailType: EmailType.RescheduledAdHocSessionReminder,
                        data: {
                            userId: session.participants[i],
                            sessionAcronym: session.acronym,
                        },
                    });
                }
            }

            return session;
        } else {
            return null;
        }
    }

    /**
     * Get a session scheduled
     * @param acronym Acronym for the session
     */
    static async getSession(acronym: string): Promise<AdHocSession | null> {
        return AdHocSessionModel.findOne({ acronym: acronym });
    }

    /**
     * Delete a session scheduled
     * @param acronym Acronym for the session
     */
    static async deleteSession(
        acronym: string
    ): Promise<{ n?: number; ok?: number; deletedCount?: number }> {
        return AdHocSessionModel.deleteOne({ acronym: acronym });
    }
}
