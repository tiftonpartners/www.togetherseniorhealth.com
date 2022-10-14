import { assert } from 'console';
import {
    AuthenticationClient,
    ManagementClient,
    User,
    UserMetadata,
    Role,
    Permission,
} from 'auth0';
require('moment-recur');
const { CourseModel } = require('../db/course.db');
const { ClassState, ClassModel } = require('../db/class.db');
const { Logger } = require('../core/logger.service');
import {
    PasswordlessRole,
    PasswordlessModel,
    Passwordless,
} from '../db/passwordless.db';
import {
    ParticipantUser,
    ParticipantUserDoc,
    ParticipantUserModel,
    UserState,
} from '../db/user.db';
import { UserService } from '../av/user.service';
import { PasswordlessService } from '../service/passwordless.service';

const log = Logger.logger('Course Bootstrapper');

const managementClient = new ManagementClient({
    domain: process.env.AUTH0_DOMAIN as string,
    clientId: process.env.AUTH0_MGMT_API_CLIENT_ID as string,
    clientSecret: process.env.AUTH0_MGMT_API_CLIENT_SECRET as string,
    scope: 'read:users update:users read:grants read:users read:roles',
});

export const GetTestUsers = async (): Promise<{
    testUsers: any[];
    testUsersByUsername: any;
    testParticipants: ParticipantUserDoc[];
}> => {
    const result: any = {};
    result.testUsersByUsername = {};
    result.testUsers = await UserService.getAuth0Users();
    result.testParticipants = await ParticipantUserModel.find({
        __t: 'ParticipantUser',
    });

    const users$ = result.testUsers.map(async (user: any) => {
        user.roles = await UserService.getUserRolesById(user.user_id);
        return user;
    });
    result.testUsers = await Promise.all(users$);
    for (const user of result.testUsers) {
        //@ts-ignore
        if (user.username && user.username.length > 0) {
            result.testUsersByUsername[user.username] = user;
        } else if (user.nickname && user.nickname.length > 0) {
            result.testUsersByUsername[user.nickname] = user;
        }
    }
    return result;
};

/**
 * Information about sample courses
 */
export const testCourses = require('./sample-courses.json');
export const maintClassCourses = require('./maint-class-courses.json');
export const betaClassCourses = require('./beta-class-courses.json');
export const botClassCourses = require('./bot-class-courses.json');
export const iosClassCourses = require('./ios-class-courses.json');

const GenerateUserTicket = async (userId: string): Promise<boolean> => {
    if (!userId || userId.length == 0) {
        return false;
    }
    const passwordless = (await PasswordlessModel.findOne({
        userId,
    })) as Passwordless;
    let ticket;

    if (passwordless) {
        ticket = passwordless.randomTicket;
        return true;
    } else {
        // No ticket has been created yet for this user

        ticket = await PasswordlessService.generateRandomUserTicket({
            // No expiration for the moment validMins: 60,
            userId: userId,
        });
        log.debug('Generated Ticket for userId:', userId, 'ticket:', ticket);
        return false;
    }
};

/**
 * Build seed data for maintenance classes
 *
 * @param logLevel
 */
export const buildMaintClassSeedData = async () => {
    log.debug('(buildMaintClassSeedData) Building Maintenance Classes');
    await buildCourseSeedData(maintClassCourses);
};
export const buildBetaClassSeedData = async () => {
    log.debug('(buildBetaClassSeedData) Building Comunity/Beta Class 1');
    await buildCourseSeedData(betaClassCourses);
};
export const buildBotClassSeedData = async () => {
    log.debug('(buildBotClassSeedData) Building Test Bot Classes');
    await buildCourseSeedData(botClassCourses);
};

export const buildIosClassSeedData = async () => {
    log.debug(
        '(buildIosClassSeedData) Building IOS Test Class',
        JSON.stringify(iosClassCourses)
    );
    await buildCourseSeedData(iosClassCourses);
};

/**
 * Buid seed/test data of courses, casses and sessions.
 * Buids 2 regular courses, 2 classes for each course, and 24 sessions for each class
 *
 * Also creates on course and class with 4 sessions for prefight testing
 */
export const buildCourseSeedData = async (
    sampleCoursesJSON?: any,
    skipsTickets: boolean = false
) => {
    const { testUsers, testUsersByUsername, testParticipants } =
        await GetTestUsers();

    if (!skipsTickets) {
        const tickets$ = testUsers.map(async (user: any) => {
            return GenerateUserTicket(user.user_id);
        });
        await Promise.all(tickets$);
    }

    const crs: [] = await CourseModel.find();
    const cls: [] = await ClassModel.find();
    let clsCount = 0; // Count the classes
    const sampleCourses = sampleCoursesJSON || testCourses;
    for (const cr of sampleCourses) {
        clsCount += cr.classes.length;
    }
    log.debug('Course Count:', crs.length);
    log.debug('Class Count:', cls.length);
    let changeMade = false;
    /* if (crs.length >= sampleCourses.length && cls.length >= clsCount) {
        log.info(`Not bootstrapping data, found ${crs.length} courses and ${cls.length} classes in the database`);
        // Restore Log level
        Logger.level = startLogLevel;
        return;
    } */

    for (const course of sampleCourses) {
        let courseDb = await CourseModel.findOne({ acronym: course.acronym });
        if (!courseDb) {
            log.debug(`Building course: "${course.acronym}"`);
            changeMade = true;
            courseDb = new CourseModel();
            Object.assign(courseDb, course);
            await courseDb.save();
        }
        let group = 0;
        for (const klass of course.classes) {
            const acronym = course.acronym + klass.acronym;
            const program = course.program;
            group++;
            try {
                let instructorId =
                    testUsersByUsername[klass.instructor]?.user_id;
                if (!(instructorId && instructorId.length)) {
                    log.warn(
                        `Cannot find instructor ${klass.instructor} for class ${acronym}. Using instructor1 instead`
                    );
                    instructorId = testUsersByUsername['instructor1'].user_id;
                }
                let klassDb = await ClassModel.findOne({ acronym: acronym });
                if (!klassDb) {
                    log.debug(`Building class: "${acronym}"`);
                    changeMade = true;
                    const newKlass = new ClassModel();
                    Object.assign(newKlass, klass);
                    newKlass.courseId = courseDb._id;
                    newKlass.name = 'Group ' + group;
                    newKlass.acronym = acronym;
                    newKlass.program = program;
                    newKlass.instructorId = instructorId;
                    await newKlass.save();

                    if (klass.participants.length > 0) {
                        const p$ = klass.participants
                            .filter(
                                (
                                    user:
                                        | string
                                        | { sid: string; program: string }
                                ) => {
                                    if (typeof user === 'string') {
                                        if (!testUsersByUsername[user]) {
                                            log.warn(
                                                `Cannot find participant "${user}" for class "${acronym}"`
                                            );
                                            return false;
                                        }
                                        return true;
                                    } else {
                                        if (user.program !== program) {
                                            log.warn(
                                                `Cannot assign participant "${user}" to class "${acronym}", programs do not match "${program}"`
                                            );
                                            return false;
                                        }

                                        if (
                                            !testParticipants.find(
                                                (p) => p.sid === user.sid
                                            )
                                        ) {
                                            log.warn(
                                                `Cannot find participant with sid "${user.sid}" for class "${acronym}"`
                                            );
                                            return false;
                                        }

                                        return true;
                                    }
                                }
                            )
                            .map(
                                async (
                                    user:
                                        | string
                                        | { sid: string; program: string }
                                ) => {
                                    if (typeof user === 'string') {
                                        return testUsersByUsername[user]
                                            .user_id;
                                    } else {
                                        const pUser = testParticipants.find(
                                            (p) => p.sid === user.sid
                                        );

                                        if (pUser) {
                                            pUser.state = UserState.Assigned;

                                            await pUser?.save();

                                            return testParticipants.find(
                                                (p) => p.sid === user.sid
                                            )?.userId;
                                        }

                                        return undefined;
                                    }
                                }
                            );

                        newKlass.participants = await Promise.all(p$);
                    } else {
                        // Fill up the class with participants that are assigned same program if none are supplied
                        const tmp$ = testParticipants
                            .filter((p) => p.program === program)
                            .slice(
                                newKlass.participants.length,
                                course.capacity
                            )

                            .map(async (pUser) => {
                                if (pUser) {
                                    pUser.state = UserState.Assigned;

                                    await pUser?.save();

                                    return pUser?.userId;
                                }

                                return undefined;
                            });

                        const tmp = await Promise.all(tmp$);
                        log.info(
                            'fill participants:',
                            JSON.stringify(tmp, null, 2),
                            newKlass.participants.length,
                            course.capacity,
                            testParticipants.length
                        );
                        newKlass.participants.push.apply(
                            newKlass.participants,
                            tmp
                        );
                    }

                    for (const f of [
                        'durationMins',
                        'lobbyTimeMins',
                        'numSessions',
                        'capacity',
                    ]) {
                        // @ts-ignore
                        newKlass[f] = course[f];
                    }
                    await newKlass.save();
                    await newKlass.buildSessionsFromSchedule();
                    await newKlass.save();
                }
            } catch (e) {
                log.error(
                    `Error creating Class ${acronym} for Course ${course.acronym}:`,
                    e
                );
            }
        }
    }

    const courses = await CourseModel.find();
    const classes = await ClassModel.find();

    if (changeMade) {
        log.info(
            `***** Changes were made Bootstrapping data.  The test user database contains ${testUsers.length} users, ${courses.length} courses and ${classes.length} classes`
        );
    }

    log.info(
        `After bootstrapping data, the database contains ${courses.length} courses and ${classes.length} classes`
    );
};
