import { ClassModel } from '../db/class.db';
import { CourseModel } from '../db/course.db';
import { AdHocSessionModel, ClassSessionModel } from '../db/session.db';
import { AVUserModel } from '../db/user.db';

const { Logger } = require('../core/logger.service');

const log = Logger.logger('Programs Migrations');

/**
 * Migrate seed/current data for programs for users / courses / classes
 */
export const migrateProgramData = async () => {
    let changeMade = false;
    let courseCount = 0,
        classCount = 0,
        classSessionCount = 0,
        adHocSessionsCount = 0,
        userCount = 0;

    const programTypeMap = new Map([
        ['Research Study', 'RS'],
        ['Community Class', 'CC'],
        ['Maintenance Class', 'MC'],
        ['Sutter Pilot', 'SUTP'],
        ['Stanford Pilot', 'STANP'],
        ['Other', 'OTHER'],
    ]);

    const avUsers = await AVUserModel.find();
    if (avUsers) {
        const avUsers$ = avUsers.map(async (avUser) => {
            let program;

            if (programTypeMap.has(avUser.program)) {
                program = programTypeMap.get(avUser.program);
            } else if (avUser.program === 'CS' || avUser.program === 'MS') {
                program =
                    avUser.program === 'CS'
                        ? 'CC'
                        : avUser.program === 'MS'
                        ? 'MC'
                        : undefined;
            }

            if (program) {
                log.debug(
                    `Updating av user program: "${avUser.get('userId')}"`
                );
                changeMade = true;
                userCount++;
                await AVUserModel.findOneAndUpdate(
                    {
                        _id: avUser._id,
                    },
                    {
                        program,
                    },
                    {
                        useFindAndModify: false,
                    }
                );
            }
        });
        await Promise.all(avUsers$);
    }

    const courses = await CourseModel.find();
    if (courses) {
        const courses$ = courses.map(async (course) => {
            let program;

            if (programTypeMap.has(course.program)) {
                program = programTypeMap.get(course.program);
            } else if (course.program === 'CS' || course.program === 'MS') {
                program =
                    course.program === 'CS'
                        ? 'CC'
                        : course.program === 'MS'
                        ? 'MC'
                        : undefined;
            }

            if (program) {
                log.debug(
                    `Updating course program: "${course.get('acronym')}"`
                );
                changeMade = true;
                courseCount++;
                await CourseModel.findOneAndUpdate(
                    {
                        _id: course._id,
                    },
                    {
                        program,
                    },
                    {
                        useFindAndModify: false,
                    }
                );
            }
        });
        await Promise.all(courses$);
    }

    const classes = await ClassModel.find();
    if (classes) {
        const classes$ = classes.map(async (klass) => {
            let program: string | undefined;

            if (programTypeMap.has(klass.program)) {
                program = programTypeMap.get(klass.program);
            } else if (klass.program === 'CS' || klass.program === 'MS') {
                program =
                    klass.program === 'CS'
                        ? 'CC'
                        : klass.program === 'MS'
                        ? 'MC'
                        : undefined;
            }
            if (program) {
                log.debug(`Updating class program: "${klass.get('acronym')}"`);
                changeMade = true;
                classCount++;

                await ClassModel.findOneAndUpdate(
                    {
                        _id: klass._id,
                    },
                    {
                        program,
                    },
                    {
                        useFindAndModify: false,
                    }
                );
            }

            if (klass.sessions) {
                let sessionChange = false;
                const sessions = klass.sessions.map((session) => {
                    if (!session.program) {
                        sessionChange = true;
                        changeMade = true;
                        classSessionCount++;
                        session.program = program || klass.program || 'OTHER';
                    }

                    return session;
                });

                if (sessionChange) {
                    log.debug(
                        `Updating class: "${klass.get(
                            'acronym'
                        )}" for sessions program`
                    );
                    await ClassModel.findOneAndUpdate(
                        {
                            _id: klass._id,
                        },
                        {
                            sessions,
                        },
                        {
                            useFindAndModify: false,
                        }
                    );
                }
            }
        });
        await Promise.all(classes$);
    }

    const adHocSessions = await AdHocSessionModel.find();
    if (adHocSessions) {
        const adHocSessions$ = adHocSessions.map(async (session) => {
            if (!session.program) {
                if (session.participants.length > 0) {
                    const participant = await AVUserModel.findOne({
                        userId: session.participants[0],
                    });

                    log.debug(
                        `Updating ad hoc session: "${session.get('acronym')}"`
                    );
                    changeMade = true;
                    adHocSessionsCount++;
                    await AdHocSessionModel.findOneAndUpdate(
                        {
                            _id: session._id,
                        },
                        {
                            program: participant
                                ? participant.program
                                : 'OTHER',
                        },
                        {
                            useFindAndModify: false,
                        }
                    );
                }
            }
        });
        await Promise.all(adHocSessions$);
    }

    if (changeMade) {
        log.info(
            `***** Changes were made Bootstrapping data. The following had their program data migrated: ${userCount} Users, ${courseCount} Courses, ${classCount} Classes, ${classSessionCount} Class Sessions, and ${adHocSessionsCount} Ad Hoc Sessions`
        );
    } else {
        log.info(`Not bootstrapping data. No program data to migrate`);
    }
    return;
};
