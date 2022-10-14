require('dotenv').config();
import { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { ClassModel, Class } from '../db/class.db';
import { ClassService } from '../service/class.service';
import { UserService } from '../av/user.service';
import { ClassSession } from '../db/session.db';
require('moment-recur');

/**
 * Controller to implement REST API for Classes in MongoDB
 */
export class ClassesController extends AuthController {
    /**
     * Get all Classes
     */
    static apiGetAllClasses = async (req: Request, res: Response) => {
        try {
            res.json(await ClassModel.find());
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get classes by course acronym.
     *
     * Detailed user information about all class
     * participants and instructors is also add to the classes returned (see
     * participantData and instructorData fields)
     */
    static apiGetClassesByCourseAcronym = async (
        req: Request<{ courseAcronym: string }>,
        res: Response
    ) => {
        try {
            const courses = await ClassService.getAllClassesByCourseAcronym(
                res.locals.userInfo,
                req.params.courseAcronym as string
            );
            res.json(courses);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get all classes for which the current authenticated user is a participant or
     * instructor.  This will include all sessions.
     */
    static apiGetMyClasses = async (req: Request, res: Response) => {
        const userInfo = res.locals.userInfo; // passed from middleware
        try {
            // @ts-ignore
            res.json(await ClassService.getUserClasses(userInfo?.userId));
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get all classes for which the specified user id is a participant or
     * instructor.  This will include all sessions. Also includes the name of the course.
     */
    static apiGetAllClassesByUserId = async (
        req: Request<{ userid: string }>,
        res: Response
    ) => {
        const userId = req.params.userid;
        try {
            const classes = await ClassService.getUserClassesWithCourseNames(
                userId
            );
            res.status(200).send(classes);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Creating class
     * @returns Created class
     */
    static apiCreateClass = async (
        req: Request<
            any,
            any,
            { class: Partial<Class>; courseAcronym: string }
        >,
        res: Response
    ) => {
        try {
            const payload = req.body;
            const userInfo = res.locals.userInfo;

            const klass = await ClassService.createClass(
                payload.class,
                payload.courseAcronym,
                userInfo
            );

            res.status(200).send(klass);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Update class
     * @returns Updated class
     */
    static apiUpdateClass = async (
        req: Request<
            any,
            any,
            { class: Partial<Class>; courseAcronym: string }
        >,
        res: Response
    ) => {
        try {
            const payload = req.body;
            const userInfo = res.locals.userInfo;

            const klass = await ClassService.updateClass(
                payload.class,
                payload.courseAcronym,
                userInfo
            );

            res.status(200).send(klass);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * If there is a current open class, return it, otherwise return the next
     * open class.
     */
    static apiGetMyUpcommingClasses = async (req: Request, res: Response) => {
        // @ts-ignore
        const userInfo = res.locals.userInfo; // passed from middleware
        const t = ClassesController.parseTimeOnQuery(req);

        try {
            const classes = await ClassService.getUpcomingClasses(
                userInfo.userId,
                t
            );
            res.status(200).json(classes);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get a class given its Acronym
     */
    static apiGetClassByAcronym = async (req: Request, res: Response) => {
        const acronym = req.params['acronym'];

        try {
            const klass = await ClassService.getClassByAcronym(acronym);
            res.status(200).send(klass);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Delete a class given its Acronym
     */
    static apiDeleteClassByAcronym = async (
        req: Request<{ acronym: string }>,
        res: Response
    ) => {
        const acronym = req.params['acronym'];

        try {
            const klass = await ClassService.deleteClassByAcronym(
                acronym,
                res.locals.userInfo
            );
            res.status(200).send(klass);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get a class given its ID
     */
    static apiGetClassById = async (
        req: Request<{ classId: string }>,
        res: Response
    ) => {
        const id = req.params['classId'];

        try {
            const klass = await ClassService.getClassById(id);
            res.status(200).send(klass);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Delete a class given its ID
     */
    static apiDeleteClassById = async (
        req: Request<{ classId: string }>,
        res: Response
    ) => {
        const id = req.params['classId'];
        const userInfo = res.locals.userInfo;

        try {
            const klass = await ClassService.deleteClassById(id, userInfo);
            res.status(200).send(klass);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get a class given the Acronym for one of its sessions.  The class,
     * including only the matching session, is returned.
     *
     * NOTE: For the moment, this relies on the convention that session acronyms
     *       follow the format '<class acronym>-<number>'.  This is used to
     *       first find the class, then filter out the session by acronym.
     */
    static apiGetClassBySessionAcronym = async (
        req: Request,
        res: Response
    ) => {
        const acronym = req.params['acronym'];
        const userInfo = res.locals.userInfo;

        try {
            const klass = await ClassService.getClassBySessionAcronym(
                acronym,
                userInfo
            );
            res.status(200).send(klass);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Update a session given the acronym for one of its sessions.
     */
    static apiUpdateClassBySessionAcronym = async (
        req: Request<{ acronym: string }, any, ClassSession>,
        res: Response
    ) => {
        const acronym = req.params['acronym'];
        const session = req.body;
        if (!acronym) {
            res.status(400).send('ERROR: Missing Acronym for Class Session');
            return;
        }
        try {
            const classInfoWithSessions = await ClassService.rescheduleSession(
                session,
                acronym
            );
            res.status(200).json(classInfoWithSessions);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Skip a specific session and puts it at end of sequence
     */
    static apiSkipSessionByAcronym = async (
        req: Request<{ acronym: string }, any, ClassSession>,
        res: Response
    ) => {
        const acronym = req.params['acronym'];
        const session = req.body;
        if (!acronym) {
            res.status(400).send('ERROR: Missing Acronym for Class Session');
            return;
        }
        try {
            const classInfoWithSessions = await ClassService.rescheduleSession(
                session,
                acronym,
                true
            );
            res.status(200).json(classInfoWithSessions);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Delete a specific session and renumber rest
     */
    static apiDeleteSessionByAcronym = async (
        req: Request<{ acronym: string }, any, ClassSession>,
        res: Response
    ) => {
        const acronym = req.params['acronym'];
        if (!acronym) {
            res.status(400).send('ERROR: Missing Acronym for Class Session');
            return;
        }
        try {
            const classInfoWithSessions = await ClassService.deleteSession(
                acronym
            );
            res.status(200).json(classInfoWithSessions);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Note that a specific user has attended a Session
     * @param req
     * @param res
     */
    static apiMarkAttendance = async (req: Request, res: Response) => {
        // @ts-ignore
        const body = req.body;
        if (!body.sessionAcronym || !body.userId) {
            res.status(400).send(
                `ERROR: Missing sessionAcronym or userId parameter in JSON body`
            );
        }
        const klass = (await ClassModel.findOne({
            'sessions.acronym': body.sessionAcronym,
        })) as Class;
        if (!klass) {
            res.status(404).send(
                `ERROR: No class for Acronym "${body.sessionAcronym}"`
            );
            return;
        }
        // @ts-ignore
        /* 		const session = klass.findSessionByAcronym(body.sessionAcronym);
        if (session) {
            session.markAttendance(userInfo.userId);
            klass.save();
            res.status(200).json(klass);
        } else {
            res.status(404).send(`ERROR: No class for Acronym "${body.sessionAcronym}"`);
        }
 */
    };

    static agg = [
        {
            $unwind: {
                path: '$sessions',
            },
        },
        {
            $project: {
                _id: 0,
                class: '$name',
                classAcronym: '$acronym',
                time: {
                    $concat: [
                        {
                            $toString: '$schedule.startTime.hour',
                        },
                        ':',
                        {
                            $toString: '$schedule.startTime.mins',
                        },
                        ' ',
                        '$schedule.startTime.tz',
                    ],
                },
                durationMins: '$durationMins',
                schedule: {
                    $reduce: {
                        in: {
                            $concat: ['$$value', '$$this', ','],
                        },
                        initialValue: '',
                        input: '$schedule.weekdays',
                    },
                },
                instructorId: '$instructorId',
                sessionAcronym: '$sessions.acronym',
                seq: '$sessions.seq',
                date: '$sessions.date0Z',
                lobbyOpen: '$sessions.lobbyOpenTime',
                start: '$sessions.scheduledStartTime',
                lobbyClosed: '$sessions.lobbyCloseTime',
            },
        },
        {
            $sort: {
                classAcronym: 1,
                seq: 1,
                sessionAcronym: 1,
            },
        },
    ];

    /**
     * Get the complete list of all class sessions.  This returns only
     * partial information about each class session, and is used mostly for
     * debugging
     *
     * @param req
     * @param res
     */
    static apiGetAllSessions = async (req: Request, res: Response) => {
        // @ts-ignore
        ClassModel.aggregate(ClassesController.agg).then((result) => {
            res.status(200).json(result);
        });
    };

    /**
     * Schedules class
     * @returns Scheduled class
     */
    static apiScheduleSessions = async (
        req: Request<any, any, { class: Partial<Class> }>,
        res: Response
    ) => {
        try {
            const payload = req.body;

            const klass = await ClassService.scheduleSessions(payload.class);
            res.status(200).send(klass);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    static addInstructorDataToSessions = async (klass: Class) => {
        const instructorIds = klass.sessions.map(
            (session) => session.instructorId
        );
        // Get combined list of users with duplicates removed
        const userIds = Array.from(new Set([...instructorIds])); // make unique

        // Get all user information in one go...
        const users = await UserService.getAuth0UsersByIds(userIds);
        const usersMap = new Map(
            users.map((obj) => [obj.user_id as string, obj])
        );

        klass.sessions = klass.sessions.map((session) => {
            if (session.instructorId && usersMap.has(session.instructorId)) {
                session.instructorData =
                    usersMap.get(session.instructorId) || {};
            }

            return session;
        });

        return klass;
    };

    /**
     * Add the user to class
     * @returns User and Class with updated info
     */
    static apiAddUserToClassById = async (
        req: Request<
            { classId: string },
            any,
            {
                userId: string;
                crossProgramConfirmed?: boolean;
            }
        >,
        res: Response
    ) => {
        try {
            const classId = req.params.classId;
            const userId = req.body.userId;
            const crossProgramConfirmed = req.body.crossProgramConfirmed;

            const response = await ClassService.addUserToClassById(
                classId,
                userId,
                crossProgramConfirmed
            );
            res.status(200).json(response);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Removes the user from the class
     * @returns User and Class with updated info
     */
    static apiRemoveUserFromClassById = async (
        req: Request<
            { classId: string },
            any,
            {
                userId: string;
            }
        >,
        res: Response
    ) => {
        try {
            const classId = req.params.classId;
            const userId = req.body.userId;

            const response = await ClassService.removeUserFromClassById(
                classId,
                userId
            );
            res.status(200).json(response);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    static getUserData = async (userIds: string[]) => {
        const userData$ = userIds.map(async (userId: string) => {
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
        });

        const userData = await Promise.all(userData$);

        return userData;
    };
}
