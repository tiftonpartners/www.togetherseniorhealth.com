/**
 * This controller is deprecated.  Sessions will no longer
 * be a separate collection in Mongo, they will be contained
 * within classes
 */
import { Request, Response, NextFunction, response } from 'express';
let moment = require('moment-timezone');
require('moment-recur');
import { Logger } from '../core/logger.service';
import { AuthController } from './auth.controller';
import { AdHocSessionService } from '../service/adhoc-session.service';
import {
    AdHocSession,
    AdHocSessionModel,
    AdHocSessionType,
    adHocSessionTypes,
    GenericSession,
} from '../db/session.db';
import { UserInfo, UserService } from '../av/user.service';
import { NotificationService } from '../service/notification.service';
import { EmailType } from '../db/email-ledger.db';

var jwt = require('jsonwebtoken');
require('dotenv').config();

const log = Logger.logger('AdhocSessionController');

export class AdhocSessionController extends AuthController {
    /**
     * Add detailed instructor user information for a list of sessions
     *
     * Note: Due to strange problems assigning to the instructor field
     * in the GenericSession object, we are converting the object
     * to a POJO via JSON.stringify/parse
     *
     * @param sessions List of sessions
     * @returns A list of JSON objects for the sessions, with the instructor
     * information added
     */
    static GetInstructorInfos(sessions: GenericSession[]): Promise<any[]> {
        const s$ = sessions.map(async (session) => {
            if (session.instructorId) {
                return UserService.rememberUser(session.instructorId).then(
                    (userInfo) => {
                        // For some reason, if we assign the user data directly to the
                        // session.instructor, it gets lost.
                        if (userInfo) {
                            const sessionPOJO = JSON.parse(
                                JSON.stringify(session)
                            );
                            sessionPOJO.instructor = userInfo.userData;
                            return sessionPOJO;
                        }

                        return;
                    }
                );
            } else {
                return;
            }
        });
        return Promise.all(s$);
    }

    /**
     * Add detailed participant user information to a session
     * and return the session as a POJO
     *
     * Note: Due to strange problems assigning to the instructor field
     * in the GenericSession object, we are converting the object
     * to a POJO via JSON.stringify/parse
     *
     * @param session Specific session
     */
    static async GetParticipantInfos(session: AdHocSession): Promise<any> {
        const participants$ = session.participants.map(
            async (userId: string) => {
                if (userId) {
                    return UserService.rememberUser(userId).then((userInfo) => {
                        // For some reason, if we assign the user data directly to the
                        // session.instructor, it gets lost.
                        if (userInfo) {
                            return userInfo.userData;
                        } else {
                            return;
                        }
                    });
                } else {
                    return;
                }
            }
        );
        const sessionPOJO = JSON.parse(JSON.stringify(session));
        sessionPOJO.participantData = await Promise.all(participants$);
        return sessionPOJO;
    }

    /**
     * Add detailed participant and instructor user information to a session
     * and return the session as a POJO
     *
     * Note: Due to strange problems assigning to fields
     * in the GenericSession object, we are converting the object
     * to a POJO via JSON.stringify/parse
     *
     * @param session Specific session
     */
    static async GetSessionUserInfos(session: AdHocSession): Promise<any> {
        return UserService.rememberUser(session.instructorId).then(
            (userInfo) => {
                if (userInfo) {
                    return AdhocSessionController.GetParticipantInfos(
                        session
                    ).then((sessionPOJO: any) => {
                        sessionPOJO.instructor = userInfo.userData;
                        return sessionPOJO;
                    });
                } else {
                    return;
                }
            }
        );
    }

    /**
     * Get all adhoc sessions.  Since it doesn't do pagination, use it mosly
     * for testing
     *
     */
    static apiGetAllAdHocSessions = async (
        req: Request<
            any,
            any,
            {
                program: string;
            }
        >,
        res: Response
    ) => {
        try {
            const sessions = AdHocSessionService.getAllAdhocSessions(
                res.locals.userInfo,
                req.query.program as string
            );
            res.json(sessions);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get specific adhoc session by acronym
     * for testing
     *
     */
    static apiGetSession = async (req: Request, res: Response) => {
        const acronym = req.params['acronym'];

        if (!acronym) {
            res.status(400).send('ERROR: Missing Acronym for Adhoc Session');
            return;
        }

        try {
            const session = await AdHocSessionService.getSession(acronym).then(
                (session) => {
                    if (session) {
                        AdhocSessionController.GetSessionUserInfos(
                            session
                        ).then((sessionPOJO) => {
                            res.status(200).json(sessionPOJO);
                        });
                    } else {
                        res.status(404).send(
                            `ERROR: No adhoc session with acronym:"${acronym}"`
                        );
                    }
                }
            );
            return;
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Delete specific adhoc session by acronym
     * for testing
     *
     */
    static apiDeleteSession = async (req: Request, res: Response) => {
        const acronym = req.params['acronym'];
        if (!acronym) {
            res.status(400).send('ERROR: Missing Acronym for Adhoc Session');
            return;
        }

        try {
            const response = await AdHocSessionService.deleteSession(acronym);

            if (response.ok === 1) {
                res.status(200).json(response.deletedCount);
            } else {
                res.status(500).send('ERROR deleting session');
            }
            return;
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    static CheckPayloadParam(params: any, paramName: string): string {
        if (!params[paramName] || params[paramName].length === 0) {
            throw new Error('Missing value for ' + paramName + ' parameter');
        }
        return params[paramName];
    }

    static CheckQueryParam(req: Request, paramName: string): string {
        // @ts-ignore
        if (!req.query[paramName] || req.query[paramName].length === 0) {
            throw new Error(
                'Missing query string value for ' + paramName + ' parameter'
            );
        }
        // @ts-ignore
        return req.query[paramName];
    }

    static CheckParam(req: Request, paramName: string): string {
        // @ts-ignore
        if (!req.params[paramName] || req.params[paramName].length === 0) {
            throw new Error(
                'Missing URL parameter string value for ' + paramName
            );
        }
        // @ts-ignore
        return req.params[paramName];
    }

    /**
     * The the "upcoming" sessions for the current user.  These are
     * any sessions currently underway, or any that are scheduled for the
     * future.
     * @param req
     * @param res
     */
    static apiGetMyUpcoming = async (req: Request, res: Response) => {
        const user = res.locals.userInfo; // passed from middleware
        const t = AdhocSessionController.parseTimeOnQuery(req); // Effective time

        const sessions = await AdHocSessionService.getUpcomingSessions(
            //@ts-ignore
            user.userId,
            t
        );
        // Enrich the result with instructor info
        const s = await AdhocSessionController.GetInstructorInfos(sessions);
        res.status(200).json(s);
    };

    /**
     * The the "upcoming" sessions for a specific user.  These are
     * any sessions currently underway, or any that are scheduled for the
     * future.
     * @param req
     * @param res
     */
    static apiGetUpcoming = async (req: Request, res: Response) => {
        const t = AdhocSessionController.parseTimeOnQuery(req); // Effective time
        let userId = null;
        try {
            userId = AdhocSessionController.CheckParam(req, 'userId');
        } catch (e) {
            res.status(400).send(
                'ERROR getting upcoming session for user: ' + e.message
            );
            return;
        }
        // @ts-ignore
        const sessions = await AdHocSessionService.getUpcomingSessions(
            userId,
            t
        );
        const s = await AdhocSessionController.GetInstructorInfos(sessions);
        res.status(200).json(s);
    };

    /**
     * Schedule a test session
     *
     */
    static apiScheduleSession = async (req: Request, res: Response) => {
        const payload = req.body;
        // name: string, startTime: any, tz: string, durationMins: number,
        // instructorId: string, participants: string[]
        let duration = 0;
        let startTime = null;
        if (payload) {
            try {
                AdhocSessionController.CheckPayloadParam(payload, 'type');
                AdhocSessionController.CheckPayloadParam(
                    payload,
                    'instructorId'
                );
                AdhocSessionController.CheckPayloadParam(
                    payload,
                    'participants'
                );
                AdhocSessionController.CheckPayloadParam(payload, 'duration');
                AdhocSessionController.CheckPayloadParam(payload, 'startTime');
                AdhocSessionController.CheckPayloadParam(payload, 'tz');
            } catch (e) {
                res.status(400).send('ERROR scheduling session: ' + e.message);
                return;
            }
            duration = parseInt(payload.duration);
            if (isNaN(duration)) {
                res.status(400).send(
                    `Duration value is not a number:"${payload.duration}"`
                );
                return;
            }
            startTime = moment(payload.startTime, moment.ISO_8601);
            if (!startTime.isValid()) {
                res.status(400).send(
                    `Invalid start time:"${payload.startTime}"`
                );
                return;
            }
            let sessionTypeName = adHocSessionTypes.get(
                payload.type as AdHocSessionType
            );
            if (sessionTypeName) {
                const session = await AdHocSessionService.scheduleSession(
                    sessionTypeName,
                    payload.type,
                    startTime,
                    payload.tz,
                    duration,
                    payload.instructorId,
                    payload.participants,
                    payload.notes,
                    payload.sendEmail
                );

                res.status(200).json(session);
            } else {
                res.status(400).send('ERROR: Invalid session type');
            }

            return;
        }
        res.status(400).send('ERROR: Missing request payload');
    };

    /**
     * ReSchedule an existing test session
     *
     */
    static apiRescheduleSession = async (req: Request, res: Response) => {
        const payload = req.body;
        // name: string, startTime: any, tz: string, durationMins: number,
        // instructorId: string, participants: string[]
        if (payload) {
            try {
                AdhocSessionController.CheckPayloadParam(payload, 'acronym');
                AdhocSessionController.CheckPayloadParam(payload, 'startTime');
                AdhocSessionController.CheckPayloadParam(payload, 'tz');
            } catch (e) {
                res.status(400).send('ERROR scheduling session: ' + e.message);
                return;
            }
            let startTime: moment.Moment = moment(
                payload.startTime,
                moment.ISO_8601
            );
            if (!startTime || !startTime.isValid()) {
                res.status(400).send(
                    `Invalid start time:"${payload.startTime}"`
                );
                return;
            }
            let sessionType = !payload.type ? undefined : payload.type;
            let sessionTypeName = adHocSessionTypes.get(
                sessionType as AdHocSessionType
            );
            let duration: number | undefined = !payload.duration
                ? undefined
                : parseInt(payload.duration);
            if (duration && isNaN(duration)) {
                res.status(400).send(
                    `Duration value is not a number:"${payload.duration}"`
                );
                return;
            }

            const session = await AdHocSessionService.rescheduleSession(
                payload.acronym,
                startTime,
                sessionTypeName,
                sessionType,
                payload.tz,
                payload.instructorId,
                payload.participants,
                duration,
                payload.notes,
                payload.sendEmail
            );

            if (session) {
                res.status(200).json(session);
            } else {
                res.status(404).send(
                    `ERROR: No session with acronym "${payload.acronym}"`
                );
            }
            return;
        }
        res.status(400).send('ERROR: Missing request payload');
    };

    /**
     * Get the session schedule for a period of time, and optionally for a specific userId.
     *
     */
    static apiGetSchedule = async (
        req: Request<
            {},
            {},
            { start: string; end: string; userId: string; program: string }
        >,
        res: Response
    ) => {
        let start: any = null,
            end: any = null; // Dates are moments
        const userId = req.query.userId as string;
        const program = req.query.program as string;
        const sessionType = req.query.sessionType as string;
        try {
            AdhocSessionController.CheckQueryParam(req, 'start');
            AdhocSessionController.CheckQueryParam(req, 'end');
        } catch (e) {
            res.status(400).send(
                'ERROR getting session schedule: ' + e.message
            );
            return;
        }
        start = moment(req.query['start'], moment.ISO_8601);
        if (!start.isValid()) {
            res.status(400).send(`Invalid start time:"${req.query['start']}"`);
            return;
        }
        end = moment(req.query['end'], moment.ISO_8601);
        if (!start.isValid()) {
            res.status(400).send(`Invalid end time:"${req.query['end']}"`);
            return;
        }

        await AdHocSessionService.getSessionSchedule(
            res.locals.userInfo,
            start,
            end,
            sessionType,
            userId,
            program
        ).then(async (sessions) => {
            return AdhocSessionController.GetInstructorInfos(sessions).then(
                (session2) => {
                    res.status(200).json(session2);
                }
            );
        });
    };
}
