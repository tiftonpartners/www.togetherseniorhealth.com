import mongoose from 'mongoose';

require('dotenv').config();
import { ClassSession } from '../db/session.db';
import moment from 'moment-timezone';
import { from } from 'rxjs';
import { filter, mergeMap, reduce } from 'rxjs/operators';

import { Logger } from '../core/logger.service';
import { UserInfo, UserService } from '../av/user.service';
import { ClassesController } from '../api/class.controller';
import {
    Class,
    ClassDoc,
    ClassModel,
    combineDateTime,
    getUpdatedDateTimes,
} from '../db/class.db';
import { CourseDoc, CourseModel } from '../db/course.db';
import { User } from 'auth0';
import { convertArrayToObject, ErrorCode } from '../db/helpers';
import { NotificationService } from './notification.service';
import { EmailType } from '../db/email-ledger.db';
import {
    AVUserModel,
    ParticipantUserDoc,
    ParticipantUserModel,
    UserState,
} from '../db/user.db';
import {
    AgoraRecordingService,
    RecordingFile,
} from '../av/agora-recording.service';

const log = Logger.logger('ClassService');

export class ClassService {
    static getMyClassesQuery(userId: string): any {
        return {
            $or: [
                { 'sessions.instructorId': userId },
                { instructorId: userId },
                { participants: userId },
            ],
        };
    }

    /**
     * Convert a moment to a Class schedule object
     * @param on When a session occurs
     * @param tz Timezone for the schedule
     */
    static toSchedule(on: moment.Moment, tz: string): any {
        let onTz = moment(on).tz(tz);

        return {
            weekdays: [onTz.format('ddd').toLowerCase()],
            startTime: {
                hour: onTz.hours(),
                mins: onTz.minutes(),
                tz: tz,
            },
        };
    }

    // Remove unnecessary fields from user info
    static cleanupUser(i: any): any {
        delete i.userData?.identities;
        delete i.userData?.last_ip;
        delete i.userData?.last_login;
        delete i.userData?.logins_count;
        delete i.userData?.email_verified;
        delete i.userData?.updated_at;
        delete i.userData?.created_at;
        return i;
    }

    /**
     * Create a Class
     * @param klass Partial class data to create class with
     * @param courseAcronym Course to assign class to
     */
    static async createClass(
        klass: Partial<Class>,
        courseAcronym: string,
        userInfo: UserInfo
    ) {
        const course = await CourseModel.findOne({
            acronym: courseAcronym,
        });

        if (!course) {
            throw new ErrorCode(
                'Course not found for course acronym ' + courseAcronym,
                400
            );
        }

        const { programs, all } = userInfo.tokenPrograms;

        if (!all && !programs.includes(course.program)) {
            throw new ErrorCode(
                'User does not have permissions to create class with this program.',
                403
            );
        }

        const dupClass = await ClassModel.findOne({
            acronym: `${course.get('acronym')}${klass.acronym}`,
        });

        if (dupClass) {
            throw new ErrorCode(
                `Class with acronym ${course.get('acronym')}${
                    klass.acronym
                } already exists`,
                400
            );
        }

        const newKlass = new ClassModel(klass);

        newKlass.set('courseId', course._id);
        newKlass.set('program', course.program);
        newKlass.set('acronym', `${course.get('acronym')}${klass.acronym}`);

        const classInfo = await newKlass.save();

        const instructorId = classInfo.instructorId;

        // Get all user information in one go...
        const users = await UserService.getAuth0UsersByIds([instructorId]);
        const usersMap = new Map(
            users.map((obj) => [obj.user_id as string, obj])
        );

        if (instructorId && usersMap.has(instructorId)) {
            classInfo.instructorData = usersMap.get(instructorId) || {};
        }

        if (classInfo) {
            return classInfo;
        } else {
            throw new ErrorCode('No class found', 404);
        }
    }

    /**
     * Update a Class
     * @param klass Partial class data to update class with
     * @param courseAcronym Course class is assigned to
     */
    static async updateClass(
        klass: Partial<Class>,
        courseAcronym: string,
        userInfo: UserInfo
    ) {
        const course = await CourseModel.findOne({
            acronym: courseAcronym,
        });

        if (!course) {
            throw new ErrorCode(
                'Course not found for course acronym ' + courseAcronym,
                404
            );
        }

        const classDb = await ClassModel.findOne({
            courseId: course._id,
            acronym: klass.acronym,
        });

        if (!classDb) {
            throw new ErrorCode(
                `No class exists for course ID ${course._id} and class acronym ${klass.acronym}`,
                404
            );
        }

        const { programs, all } = userInfo.tokenPrograms;

        if (!all && !programs.includes(classDb.program)) {
            throw new ErrorCode(
                'User does not have permissions to update class with this program.',
                403
            );
        }

        // If the instructor id is being updated we need to update the sessions as well
        if (klass.instructorId && classDb.instructorId !== klass.instructorId) {
            await classDb.updateInstructor(
                classDb.instructorId,
                klass.instructorId
            );

            await classDb.save();
        }

        const updatedKlass = await ClassModel.findOneAndUpdate(
            { courseId: course._id, acronym: klass.acronym },
            klass,
            { new: true, useFindAndModify: false }
        );

        if (updatedKlass) {
            // Get all user information in one go...
            const users = await UserService.getAuth0UsersByIds([
                updatedKlass.instructorId,
            ]);

            const usersMap = new Map(
                users.map((obj) => [obj.user_id as string, obj])
            );

            if (
                updatedKlass.instructorId &&
                usersMap.has(updatedKlass.instructorId)
            ) {
                updatedKlass.instructorData =
                    usersMap.get(updatedKlass.instructorId) || {};
            }

            return updatedKlass;
        } else {
            throw new ErrorCode(
                'No class exists for acronym ' + klass.acronym,
                404
            );
        }
    }

    /**
     * Schedule sessions for class
     * @param klass Partial class data to update and schedule sessions
     */
    static async scheduleSessions(klass: Partial<Omit<ClassDoc, 'sessions'>>) {
        const updatedClass = await ClassModel.findOneAndUpdate(
            { _id: klass._id },
            {
                ...klass,
            },
            { new: true, useFindAndModify: false }
        );

        if (!updatedClass) {
            throw new ErrorCode(
                'No class exists for acronym ' + klass.acronym,
                404
            );
        }

        await updatedClass.buildSessionsFromSchedule();

        const classInfo = await updatedClass.save();

        const classInfoWithSessions =
            await ClassesController.addInstructorDataToSessions(classInfo);

        if (classInfoWithSessions) {
            return classInfoWithSessions;
        } else {
            throw new ErrorCode('Scheduling sessions for class', 404);
        }
    }

    /**
     * reschedule sessions for class
     * @param session Partial session data to update
     * @param sessionAcronym Session acronym
     * @param skip
     */
    static async rescheduleSession(
        session: Partial<ClassSession>,
        sessionAcronym: string,
        skip: boolean = false
    ) {
        const klass = (await ClassModel.findOne({
            'sessions.acronym': sessionAcronym,
        })) as Class;

        if (!klass) {
            throw new ErrorCode(
                `No class with session that has acronym "${sessionAcronym}"`,
                404
            );
        }
        const sessionDb = klass.sessions.find((session) => {
            return session.acronym === sessionAcronym;
        });

        if (!sessionDb) {
            throw new ErrorCode(
                `No session that has acronym "${sessionAcronym}"`,
                404
            );
        }

        let updates: any = {};

        const hasDateChanged =
            (session?.date0Z && session?.date0Z !== sessionDb.date0Z) ||
            (session?.scheduledStartTime &&
                session?.scheduledStartTime.toString() !==
                    sessionDb.scheduledStartTime.toISOString());
        if (hasDateChanged) {
            const tz = session.tz || klass.schedule.startTime.tz;
            const dateTime = combineDateTime(
                session.date0Z || sessionDb.date0Z,
                session.scheduledStartTime
                    ? moment(session.scheduledStartTime).toISOString()
                    : sessionDb?.scheduledStartTime.toISOString()
            );

            const { date0Z, start, end, lobbyOpen, lobbyClose } =
                getUpdatedDateTimes(klass, dateTime, {
                    hour: dateTime.tz(tz).hour(),
                    mins: dateTime.tz(tz).minute(),
                    tz,
                });

            updates['sessions.$.date0Z'] = date0Z;
            updates['sessions.$.scheduledStartTime'] = start;
            updates['sessions.$.scheduledEndTime'] = end;
            updates['sessions.$.lobbyOpenTime'] = lobbyOpen;
            updates['sessions.$.lobbyCloseTime'] = lobbyClose;
        }
        if (session?.helpMessage) {
            updates['sessions.$.helpMessage'] = session.helpMessage;
        }

        if (session?.instructorId) {
            updates['sessions.$.instructorId'] = session.instructorId;
        }

        updates['sessions.$.disableEmails'] = Boolean(session.disableEmails);

        const updatedClass = (await ClassModel.findOneAndUpdate(
            { 'sessions.acronym': sessionAcronym },
            updates,
            {
                new: true,
                useFindAndModify: false,
            }
        )) as ClassDoc;

        if (!updatedClass) {
            throw new ErrorCode(
                `No class for Acronym "${sessionAcronym}"`,
                404
            );
        }

        if (skip) {
            // this method calls reorderSessionsByStartDate internally
            await updatedClass.skipSession(sessionAcronym);
        } else {
            await updatedClass.reorderSessionsByStartDate();
        }

        const classInfo = await updatedClass.save();

        // if selected, send email to each participant
        if (hasDateChanged) {
            for (let i = 0; i < updatedClass.participants.length; i++) {
                await NotificationService.sendNotification({
                    emailType: EmailType.RescheduledClassReminder,
                    data: {
                        userId: updatedClass.participants[i],
                        classAcronym: updatedClass.acronym,
                    },
                });
            }
        }

        return await ClassesController.addInstructorDataToSessions(classInfo);
    }

    /**
     * delete session for class
     * @param sessionAcronym Session acronym
     */
    static async deleteSession(sessionAcronym: string) {
        const klass = await ClassModel.findOne({
            'sessions.acronym': sessionAcronym,
        });

        if (!klass) {
            throw new ErrorCode(
                `No class with session that has acronym "${sessionAcronym}"`,
                404
            );
        }
        const sessionDb = klass.sessions.find((session) => {
            return session.acronym === sessionAcronym;
        });

        if (!sessionDb) {
            throw new ErrorCode(
                `No session that has acronym "${sessionAcronym}"`,
                404
            );
        }

        await klass.deleteSession(sessionAcronym);
        const classInfo = await klass.save();

        return await ClassesController.addInstructorDataToSessions(classInfo);
    }

    /**
     * Get a ClassSession given its acronym
     */
    static async getClassSession(
        acronym: string
    ): Promise<ClassSession | null> {
        return ClassModel.findOne({ 'sessions.acronym': acronym }).then(
            (klass: Class | null) => {
                if (klass) return klass.findSessionByAcronym(acronym);
                else return null;
            }
        );
    }

    /**
     * Get a Class given its acronym
     */
    static async getClassByAcronym(acronym: string): Promise<ClassDoc | null> {
        if (!acronym) {
            throw new ErrorCode('Missing Acronym for Class', 400);
        }
        const klass = (await ClassModel.findOne({
            acronym: acronym,
        })) as ClassDoc;

        if (klass) {
            return klass;
        } else {
            throw new ErrorCode(`No class with acronym "${acronym}"`, 404);
        }
    }

    /**
     * Get a Class given a session acronym
     */
    static async getClassBySessionAcronym(
        acronym: string,
        userInfo: UserInfo
    ): Promise<ClassDoc | null> {
        if (!acronym) {
            throw new ErrorCode('Missing Acronym for Class', 400);
        }
        const klass = (await ClassModel.findOne({
            'sessions.acronym': acronym,
        })) as ClassDoc;

        if (!klass) {
            throw new ErrorCode(
                `No class for session acronym "${acronym}"`,
                404
            );
        }

        klass.filterSessionsByAcronym(acronym);
        if (klass.sessions.length > 0) {
            const session = klass.sessions[0];

            // Check at session level
            if (
                !klass.participants.includes(userInfo.userId) &&
                session.instructorId !== userInfo.userId
            ) {
                throw new ErrorCode(
                    'User does not have access to this session',
                    401
                );
            }

            return klass;
        } else {
            throw new ErrorCode(`No session with acronym "${acronym}"`, 404);
        }
    }

    /**
     * Get a Class given its id
     */
    static async getClassById(id: string): Promise<Class | null> {
        if (!id) {
            throw new ErrorCode('Missing Id for Class', 400);
        }
        const klass = (await ClassModel.findOne({
            _id: id,
        })) as ClassDoc;

        if (klass) {
            const classWithParticipantData =
                await ClassService.addParticipantData(klass);
            return classWithParticipantData;
        } else {
            throw new ErrorCode(`No class with id "${id}"`, 404);
        }
    }

    /**
     * Delete a Class given its acronym
     */
    static async deleteClassByAcronym(
        acronym: string,
        userInfo: UserInfo
    ): Promise<ClassDoc | null> {
        if (!acronym) {
            throw new ErrorCode('Missing Acronym for Class', 400);
        }

        const { programs, all } = userInfo.tokenPrograms;

        const classInfo = await ClassModel.findOne({ acronym: acronym });

        if (!classInfo) {
            throw new ErrorCode('ERROR No Course with acronym ' + acronym, 404);
        }

        if (!all && !programs.includes(classInfo.program)) {
            throw new ErrorCode(
                'User does not have permissions to delete class with this program.',
                403
            );
        }
        const klass = (await ClassModel.findOneAndDelete(
            {
                acronym: acronym,
            },
            { useFindAndModify: false }
        )) as ClassDoc;

        if (klass) {
            return klass;
        } else {
            throw new ErrorCode(`No class with acronym "${acronym}"`, 404);
        }
    }

    /**
     * Delete all classes associated with a course
     */
    static async deleteClassesByCourseId(
        courseId: string,
        userInfo: UserInfo
    ): Promise<(ClassDoc | undefined)[]> {
        if (!courseId) {
            throw new ErrorCode('Missing ID for Course', 400);
        }

        const { programs, all } = userInfo.tokenPrograms;

        const classes = await ClassModel.find({ courseId });

        if (!classes) {
            throw new ErrorCode(
                'ERROR No Classes with Course ID ' + courseId,
                404
            );
        }

        // Delete all classes
        const $p = classes.map(async (classInfo) => {
            if (!all && !programs.includes(classInfo.program)) {
                throw new ErrorCode(
                    'User does not have permissions to delete class with this program.',
                    403
                );
            }
            const klass = (await ClassModel.findOneAndDelete(
                {
                    acronym: classInfo.acronym,
                },
                { useFindAndModify: false }
            )) as ClassDoc;

            if (klass) {
                return klass;
            } else {
                log.warn(`No class with acronym "${classInfo.acronym}"`);
            }
        });

        return Promise.all($p);
    }

    /**
     * Delete a Class given its id
     */
    static async deleteClassById(
        id: string,
        userInfo: UserInfo
    ): Promise<ClassDoc | null> {
        if (!id) {
            throw new ErrorCode('Missing id for Class', 400);
        }

        const { programs, all } = userInfo.tokenPrograms;

        const classInfo = await ClassModel.findOne({ _id: id });

        if (!classInfo) {
            throw new ErrorCode('ERROR No Course with id ' + id, 404);
        }

        if (!all && !programs.includes(classInfo.program)) {
            throw new ErrorCode(
                'User does not have permissions to delete class with this program.',
                403
            );
        }

        const klass = (await ClassModel.findOneAndDelete(
            {
                _id: id,
            },
            { useFindAndModify: false }
        )) as ClassDoc;

        if (klass) {
            return klass;
        } else {
            throw new ErrorCode(`No class with acronym "${id}"`, 404);
        }
    }

    /**
     * Adds a user to class by the user id
     */
    static async addUserToClassById(
        classId: string,
        userId: string,
        crossProgramConfirmed?: boolean
    ): Promise<{
        class?: Class;
        user?: ParticipantUserDoc;
        crossProgram?: true;
    } | null> {
        if (!userId) {
            throw new ErrorCode('Missing userId', 400);
        }

        const user = await ParticipantUserModel.findOne({
            userId,
        });

        if (!user) {
            throw new ErrorCode('No Participant with id ' + userId, 400);
        }

        const klass = await ClassModel.findOne({
            _id: classId,
        });

        if (klass) {
            if (!klass.capacity) {
                throw new ErrorCode('Class has not been scheduled yet.', 400);
            }
            if (!crossProgramConfirmed && user.program !== klass.program) {
                return { crossProgram: true };
            }

            if (klass.participants.length < klass.capacity) {
                const isAdded = await klass.addParticipant(userId);

                if (isAdded) {
                    await klass.save();

                    const updatedUser = await AVUserModel.findOneAndUpdate(
                        { userId },
                        {
                            state: UserState.Assigned,
                        },
                        {
                            new: true,
                            upsert: true,
                            useFindAndModify: false,
                        }
                    );

                    const course = await CourseModel.findOne({
                        _id: klass.courseId,
                    });

                    const classWithParticipantData =
                        await ClassService.addParticipantData(klass);

                    return {
                        user: updatedUser,
                        class: {
                            ...classWithParticipantData,
                            courseName: course?.name || '',
                        } as Class,
                    };
                } else {
                    throw new ErrorCode(
                        'User already added to this class',
                        400
                    );
                }
            } else {
                throw new ErrorCode(
                    'Class is at max capacity of ' + klass.capacity,
                    400
                );
            }
        } else {
            throw new ErrorCode('No Class with id ' + classId, 404);
        }
    }

    /**
     * Remove a user from class by the user id
     */
    static async removeUserFromClassById(
        classId: string,
        userId: string
    ): Promise<{
        class?: Class;
        user?: ParticipantUserDoc;
    } | null> {
        if (!userId) {
            throw new ErrorCode('Missing userId', 400);
        }

        const klass = await ClassModel.findOne({
            _id: classId,
        });

        if (klass) {
            await klass.removeParticipant(userId);
            await klass.save();

            let updatedUser;
            const user = await AVUserModel.findOne({ userId });

            if (user) {
                const classes = await ClassService.getUserClasses(userId);
                updatedUser = await AVUserModel.findOneAndUpdate(
                    { userId },
                    {
                        state:
                            classes && classes.length > 0
                                ? UserState.Assigned
                                : UserState.NotYetAssigned,
                    },
                    {
                        new: true,
                        upsert: true,
                        useFindAndModify: false,
                    }
                );
            }

            const classWithParticipantData =
                await ClassService.addParticipantData(klass);

            return {
                user: updatedUser,
                class: classWithParticipantData,
            };
        } else {
            throw new ErrorCode('ERROR No Class with id ' + classId, 404);
        }
    }

    static sortClassesByFirstSession(classes: Class[]) {
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

    /**
     * Get all courses by course acronym
     * @param userInfo Info object from user data
     * @param courseAcronym Acronym for course
     */
    static async getAllClassesByCourseAcronym(
        userInfo: UserInfo,
        courseAcronym: string
    ): Promise<Class[]> {
        try {
            const course = (await CourseModel.findOne({
                acronym: courseAcronym,
            })) as CourseDoc;

            if (course) {
                const program = course.program;
                const data = userInfo.tokenPrograms;
                const programs = data.programs;

                // if courses program is not included in user's authorized programs
                // to view then return nothing
                if (!programs.includes('*') && !programs.includes(program)) {
                    return [];
                }
                const classes = await ClassModel.find({
                    courseId: course._id,
                });
                // Gather up user Ids from all classes
                const classInstructorIds = classes.map(
                    (klass) => klass.instructorId
                );
                const sessionInstructorIds = classes.map((klass) =>
                    klass.sessions.map((session) => session.instructorId)
                );

                const instructorIds = classInstructorIds.concat(
                    ...sessionInstructorIds
                );

                const participantIds = ([] as string[]).concat.apply(
                    [],
                    classes.map((klass) => klass.participants)
                );
                const userIds = Array.from(new Set([...instructorIds])); // make unique

                // Get all user information in one go...
                const users = await UserService.getAuth0UsersByIds(userIds);
                const usersMap = new Map(
                    users.map((obj) => [obj.user_id as string, obj])
                );

                // Sort out users + participants to their respective classes and add extra
                // properties
                const classesWithUserData = classes.map(async (klass) => {
                    if (
                        klass.instructorId &&
                        usersMap.has(klass.instructorId)
                    ) {
                        klass.instructorData =
                            usersMap.get(klass.instructorId) || {};
                    }

                    klass.sessions = klass.sessions.map((session) => {
                        if (
                            session.instructorId &&
                            usersMap.has(session.instructorId)
                        ) {
                            session.instructorData =
                                usersMap.get(session.instructorId) || {};
                        }

                        return session;
                    });

                    const classWithUserData =
                        await ClassService.addParticipantData(klass);
                    return classWithUserData;
                });

                if (classesWithUserData) {
                    return Promise.all(classesWithUserData);
                } else {
                    throw new Error(
                        `No classes with course acronym "${courseAcronym}"`
                    );
                }
            } else {
                throw new Error(
                    `No course with course acronym "${courseAcronym}"`
                );
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Look for any classes with upcoming sessions with the same date (today)
     *
     * @param now
     */
    static async getUpcomingClassesToday(
        now?: moment.Moment
    ): Promise<Class[]> {
        const t: moment.Moment = now || moment();
        const classesUpcoming = await ClassService.getUpcomingClasses(
            'all',
            now
        );

        return classesUpcoming.filter((klass) => {
            const sessionDate = moment(
                klass.sessions[0].scheduledStartTime
            ).utc();
            return (
                t.utc().isSame(sessionDate, 'day') &&
                t.utc().isSame(sessionDate, 'date')
            );
        });
    }

    /**
     * Look for classes that a user participates in (as a participant or instructor),
     * that have "upcoming" sessions, and return the classes with only the first upcoming
     * session in each.
     *
     * Classes that they participant in that do not have upcoming sessions will not
     * be in the list, and each class will have at most one session in it.  Classes will
     * be sorted in ascending order according to the lobbyOpenTime.
     *
     * The class will be enriched with details of the instructor in the 'instructor'
     * property.  In the case that the session has a different instructor than the class,
     * the instructor information in the class will overridden by the instructor in the
     * session.
     *
     * An upcoming session is one that can now be joined, or can be joined in the future.
     *
     * @param userId User signed up for classes
     * @param now
     */
    static async getUpcomingClasses(
        userId: string,
        now?: moment.Moment
    ): Promise<Class[]> {
        try {
            const t: moment.Moment = now ? now.utc() : moment().utc();
            log.debug(
                `(getUpcomingClasses) userId: ${userId}, now: ${t.format()}`
            );
            return new Promise(async (resolve, reject) => {
                from(
                    await ClassModel.find(
                        {
                            ...(userId === 'all'
                                ? {}
                                : ClassService.getMyClassesQuery(userId)),
                            'sessions.lobbyCloseTime': {
                                $gte: t,
                            },
                        },
                        //keep only the nearest upcoming session
                        {
                            disableEmails: 0,
                            sessions: {
                                $elemMatch: {
                                    lobbyCloseTime: {
                                        $gte: t,
                                    },
                                },
                            },
                        }
                    )
                        .limit(25)
                        .sort({ 'sessions.lobbyOpenTime': 1 }) //< does not look like working as expected
                )
                    .pipe(
                        filter((c) => {
                            // only emit upcoming classes for this user
                            if (userId !== 'all') {
                                if (c.isAnInstructor(userId)) {
                                    // For instructors, we only want those sessions assigned to them,
                                    // which is usually, but not always the same instructor assigned
                                    // to the class
                                    log.debug(
                                        '(getUpcomingClasses) Is Instructor'
                                    );
                                    // @ts-ignore
                                    c.filterSessionsByInstructor(userId);
                                }
                            }

                            // Don't return empty classes
                            if (c.sessions.length === 0) {
                                log.debug(
                                    '(apiGetMyUpcommingClasses) Filtering empty Class:',
                                    c.acronym
                                );
                            }
                            return c.sessions.length > 0;
                        }),
                        mergeMap((c: Class) => {
                            return from(
                                (async () => {
                                    // deep copy and de-classify
                                    const c_copy: Class = JSON.parse(
                                        JSON.stringify(
                                            c,
                                            (key: string, val: string): any => {
                                                if (
                                                    [
                                                        'identities',
                                                        'attendees',
                                                    ].includes(key)
                                                )
                                                    return undefined;
                                                else return val;
                                            }
                                        )
                                    );

                                    // Get instructor info, using instruction from the session if it is not
                                    // the same as the class
                                    if (
                                        c_copy.instructorId ==
                                        c_copy.sessions[0].instructorId
                                    ) {
                                        const ins =
                                            await UserService.rememberUser(
                                                c_copy.instructorId
                                            );
                                        if (ins?.userData) {
                                            c_copy.instructor =
                                                ClassService.cleanupUser(ins)
                                                    ?.userData ?? {};
                                        } else {
                                            log.error(
                                                'No instructor found for id: ' +
                                                    c_copy.instructorId
                                            );
                                        }
                                    } else {
                                        const ins =
                                            await UserService.rememberUser(
                                                c_copy.sessions[0].instructorId
                                            );
                                        if (ins?.userData) {
                                            c_copy.instructor =
                                                ClassService.cleanupUser(ins)
                                                    ?.userData || {};
                                        } else {
                                            log.error(
                                                'No instructor found for id: ' +
                                                    c_copy.instructorId
                                            );
                                        }
                                    }
                                    return c_copy;
                                })()
                            );
                        }),
                        //@ts-ignore
                        reduce((acc: Class[], c: Class) => {
                            // Combine them all into an output array
                            acc.push(c);
                            return acc;
                        }, [] as Class[])
                    )
                    .subscribe(
                        (classes) => {
                            resolve(classes);
                        },
                        (err) =>
                            reject(
                                new Error(
                                    'Error getting upcoming classes:' + err
                                )
                            )
                    );
            });
        } catch (e) {
            log.error(e);
            throw new Error(e as string);
        }
    }

    /**
     * Get all classes for which the current authenticated user is a participant or
     * instructor.  This will include all sessions.
     */
    static async getUserClasses(userId: string): Promise<ClassDoc[]> {
        return ClassModel.find(ClassService.getMyClassesQuery(userId));
    }

    /**
     * Get all classes for which the current authenticated user is a participant or
     * instructor.  This will include all sessions and the course name.
     */
    static async getUserClassesWithCourseNames(
        userId: string
    ): Promise<Class[]> {
        const classes = await ClassService.getUserClasses(userId);
        const courseIds = classes.map((klass) => klass.courseId);
        const courses = await CourseModel.find({
            _id: { $in: courseIds },
        });
        const courseNames = convertArrayToObject(courses, '_id', 'name');

        const classesWithCourseNames = classes.map((klass) => {
            return {
                ...klass.toObject(),
                courseName: courseNames[String(klass.courseId)],
            };
        });

        return classesWithCourseNames as Class[];
    }

    /**
     * Get recording files from s3 that relate to a specific class session
     */
    static async getRecordingFilesForClassSession(
        acronym: string
    ): Promise<RecordingFile[] | null> {
        if (!acronym) {
            throw new ErrorCode('Missing Acronym for Class', 400);
        }
        const recordings =
            await AgoraRecordingService.getRecordingFilesForSession(acronym);
        if (recordings) {
            return recordings;
        } else {
            throw new ErrorCode(`No recordings with acronym "${acronym}"`, 404);
        }
    }

    static async addParticipantData(klass: ClassDoc): Promise<Class> {
        const classParticipantData = await ClassesController.getUserData(
            klass.participants
        );
        let participantsData: User[] = [];

        if (klass.participants && klass.participants.length > 0) {
            participantsData = klass.participants.map((participant) => {
                return (
                    classParticipantData.find(
                        (participantData) =>
                            participantData?.user_id === participant
                    ) || ({} as User)
                );
            });
        }

        return { ...klass.toObject(), participantsData } as Class;
    }
}
