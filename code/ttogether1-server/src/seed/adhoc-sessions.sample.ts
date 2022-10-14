import { TestUserService } from '../../test/utility/test-users.service';
import { AdHocSession, AdHocSessionType } from '../db/session.db';
import { AVUser } from '../db/user.db';

const moment = require('moment-timezone');
const { GetTestUsers } = require('../../src/seed/course.sample');

const { ObjectId } = require('mongodb');
const { assert } = require('console');
const { AdHocSessionModel } = require('../../src/db/session.db');
const { VideoProvider } = require('../../src/db/class.db');
const { Logger } = require('../core/logger.service');

// Sessions to create.
export const SessionsData = [
    {
        instructor: 'instructor1',
        participants: ['test1', 'participantOne'],
        startTime: null,
        program: 'RS',
    },
    {
        instructor: 'instructor2',
        participants: ['test2'],
        startTime: null,
        program: 'RS',
    },
    {
        instructor: 'instructor3',
        participants: ['test3'],
        startTime: null,
        program: 'RS',
    },
    {
        instructor: 'instructor3',
        participants: ['test1', 'test2', 'test3'],
        startTime: null,
        program: 'CC',
    },
    {
        instructor: 'instructor3',
        participants: ['instructor1'],
        startTime: null,
        program: 'CC',
    },
    {
        instructor: 'inst1-auto',
        participants: ['Prospect AutotestTwo', 'proscoord1-auto'],
        type: AdHocSessionType.TechCheck,
        startTime: '2022-01-01T06:30:00.000Z',
        program: 'CC',
    },
    {
        instructor: 'inst2-auto',
        participants: ['Screened AutotestTwo'],
        type: AdHocSessionType.TechCheck,
        startTime: '2021-04-02T06:30:00.000Z',
        program: 'CC',
    },
];

const log = Logger.logger('AdHoc Session Bootstrapper');

const START_TIME_1 = '2021-10-01 10:00';
const tz = 'America/Los_Angeles';
const start = moment.tz(START_TIME_1, tz);

// Calculate start times
SessionsData.forEach((s, index) => {
    s.startTime = start.toDate();
    start.add(1, 'h');
});

export const ExpectedUserSessionCounts = [
    { user: 'instructor1', count: 2 },
    { user: 'instructor2', count: 1 },
    { user: 'instructor3', count: 3 },
    { user: 'test1', count: 2 },
    { user: 'Prospect AutotestTwo', count: 1 },
    { user: 'Screened AutotestTwo', count: 1 },
    { user: 'inst1-auto', count: 1 },
    { user: 'inst2-auto', count: 1 },
    { user: 'proscoord1-auto', count: 1 },
];

export const buildSampleAdHocSessions = async (): Promise<AdHocSession[]> => {
    const { testParticipants } = await GetTestUsers();
    const testUsersByUsername = TestUserService.getAllTestUsersByUsername();

    const sessions$ = SessionsData.map(async (s, index) => {
        const session = new AdHocSessionModel() as AdHocSession;
        // Sessions are spaced 1 hour apart
        // @ts-ignore
        session.setStartTime(s.startTime, 59, 0, tz);

        const vals = {
            name: 'Test AdHoc Session ' + index,
            sessionType: s.type || AdHocSessionType.ResearchInformation,
            provider: VideoProvider.AGORA,
            providerId: 'AHTESTSESSION1' + index,
            acronym: 'AHTESTSESSION1' + index,
            instructorId: testUsersByUsername[s.instructor]?.user_id || '1',
            description: `Test AdHoc Session number ${index}, just for fun`,
            capacity: s.participants.length + 1,
            program: s.program,
            participants: s.participants.map((p) => {
                const tp: AVUser | undefined = testParticipants.find(
                    (tp: AVUser) => tp.screenName === p
                );

                return testUsersByUsername[p]
                    ? testUsersByUsername[p].user_id
                    : tp?.userId;
            }),
        };
        Object.assign(session, vals);
        const existing = await AdHocSessionModel.findOne({ name: vals.name });
        if (!existing) {
            log.debug('Creating AdHoc Session:', session.name);
            return await session.save();
        } else {
            log.debug('AdHoc Session Already Exists:', session.name);
            return existing;
        }
    });

    // Results of session for each user in expected
    return Promise.all(sessions$);
};
