require('moment-recur');
require('dotenv').config();
import moment, { Moment } from 'moment-timezone';
import mongoose from 'mongoose';
import {
    AdHocSessionModel,
    AdHocSessionType,
    VideoProvider,
} from '../../src/db/session.db';
import {
    buildSampleAdHocSessions,
    SessionsData,
} from '../../src/seed/adhoc-sessions.sample';
import { AdHocSessionService } from '../../src/service/adhoc-session.service';
import { getMongoConfig, TestGlobalMongoConfig } from '../config/testGlobal';
import { TestUserService } from '../utility/test-users.service';
import { Logger } from '../../src/core/logger.service';

let mongoConfig = new TestGlobalMongoConfig();

const testUsersByUsername = TestUserService.getAllTestUsersByUsername();
const START_TIME_1 = '2021-10-01 22:00';

describe('AdhocSessionDb Tests', () => {
    beforeEach(async () => {
        mongoConfig = await getMongoConfig();
        await mongoose.connect(mongoConfig.mongoUri, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
        });
        await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    afterEach(async () => {
        if (mongoose && mongoose.connection && mongoose.connection.db) {
            await mongoose.connection.db.dropDatabase();
        }
        await mongoose.connection.close();
    });

    it('should set the times for a session', () => {
        const session = new AdHocSessionModel();
        const tz = 'America/Los_Angeles';
        const start = moment.tz(START_TIME_1, tz);
        const startTime = start.toDate();
        session.setStartTime(startTime, 60, 0, tz);

        expect(session.isOpenNow(moment(start).add(1, 's'))).toBeTruthy();
        expect(session.isOpenNow(moment(start).add(-1, 'm'))).toBeFalsy();
        expect(session.opensAfterNow(moment(start).add(-1, 'm'))).toBeTruthy();
        expect(session.isOpenNow(moment(start).add(61, 'm'))).toBeFalsy();
        expect(session.date0Z).toEqual('2021-10-01');
    });

    it('should be able to create and retrieve a session', async () => {
        const session = new AdHocSessionModel();
        const tz = 'America/Los_Angeles';
        const start = moment.tz(START_TIME_1, tz);
        const startTime = start.toDate();
        session.setStartTime(startTime, 60, 0, tz);

        const vals = {
            name: 'Test AdHoc Session',
            acronyn: 'AHTESTSESSION1',
            sessionType: AdHocSessionType.ResearchInformation,
            provider: VideoProvider.AGORA,
            providerId: 'AHTESTSESSION1',
            instructorId: testUsersByUsername['instructor1'].user_id,
            description: 'Test AdHoc Session just for fun',
            capacity: 2,
            program: 'RS',
            participants: [
                testUsersByUsername['instructor1'].user_id,
                testUsersByUsername['test1'].user_id,
            ],
        };
        Object.assign(session, vals);
        const s = await session.save();
        expect(s).toBeTruthy();

        const sessions = await AdHocSessionModel.find();
        expect(sessions.length).toEqual(1);
        expect(sessions[0].name).toEqual(vals.name);
    });

    it('Should find multiple upcoming ad-hoc sessions', async () => {
        await buildSampleAdHocSessions();
        const instructor1 = testUsersByUsername['instructor1'].user_id;
        let now = moment('2021-10-01T00:00:00.000Z').add(-1, 'm'); // Before Everything

        const sessions = await AdHocSessionService.getUpcomingSessions(
            instructor1,
            now
        );
        expect(sessions.length).toEqual(2);
        let m: Moment;
        sessions.forEach((s) => {
            expect(
                instructor1 === s.instructorId ||
                    s.participants.includes(instructor1)
            ).toBeTruthy();
            if (m) {
                // Should be in ascending order
                expect(m.isBefore(s.lobbyOpenTime));
            }
            m = moment(s.lobbyOpenTime);
        });
    });

    it('Should find single upcoming ad-hoc session', async () => {
        const testSessions = await buildSampleAdHocSessions();
        const instructor1 = testUsersByUsername['instructor1'].user_id;
        let now = moment(SessionsData[1].startTime).add(1, 'm'); // Excludes the first one

        const sessions = await AdHocSessionService.getUpcomingSessions(
            instructor1,
            now
        );
        expect(sessions.length).toEqual(1);
        let m: Moment;
        sessions.forEach((s) => {
            expect(
                instructor1 === s.instructorId ||
                    s.participants.includes(instructor1)
            ).toBeTruthy();
            if (m) {
                // Should be in ascending order
                expect(m.isBefore(s.lobbyOpenTime));
            }
            m = moment(s.lobbyOpenTime);
        });
    });

    it('Should get session schedule - all sessions', async () => {
        const testSessions = await buildSampleAdHocSessions();
        const instructor1 = testUsersByUsername['instructor1'].user_id;
        let start = moment(SessionsData[0].startTime).add(-1, 'm'); // Before the first one
        let end = moment(SessionsData[SessionsData.length - 1].startTime).add(
            61,
            'm'
        ); // After the last one

        const sessions = await AdHocSessionService.getSessionScheduleForUser(
            instructor1,
            start,
            end
        );
        expect(sessions.length).toEqual(2);
        let m: Moment;
        sessions.forEach((s) => {
            expect(
                instructor1 === s.instructorId ||
                    s.participants.includes(instructor1)
            ).toBeTruthy();
            if (m) {
                // Should be in ascending order
                expect(m.isBefore(s.lobbyOpenTime));
            }
            m = moment(s.lobbyOpenTime);
        });
    });

    it('Should get session schedule - one session', async () => {
        const testSessions = await buildSampleAdHocSessions();
        const instructor1 = testUsersByUsername['instructor1'].user_id;
        let start = moment(SessionsData[1].startTime).add(1, 'm'); // Before the first one
        let end = moment(SessionsData[SessionsData.length - 1].startTime).add(
            61,
            'm'
        ); // After the last one

        const sessions = await AdHocSessionService.getSessionScheduleForUser(
            instructor1,
            start,
            end
        );
        expect(sessions.length).toEqual(1);
        let m: Moment;
        sessions.forEach((s) => {
            expect(
                instructor1 === s.instructorId ||
                    s.participants.includes(instructor1)
            ).toBeTruthy();
            if (m) {
                // Should be in ascending order
                expect(m.isBefore(s.lobbyOpenTime));
            }
            m = moment(s.lobbyOpenTime);
        });
    });

    it('should round session start times to 15 minute slots', () => {
        let startDate = moment('2021-12-07T20:01:00.000Z', moment.ISO_8601);
        let rounded = AdHocSessionService.roundStartTime(startDate);
        expect(rounded.isSame('2021-12-07T20:00:00.000Z', 's')).toBeTruthy();
        expect(rounded.isSame('2021-12-07T20:01:00.000Z', 's')).toBeFalsy();

        startDate = moment('2021-12-07T20:18:00.000Z', moment.ISO_8601);
        rounded = AdHocSessionService.roundStartTime(startDate);
        expect(rounded.isSame('2021-12-07T20:15:00.000Z', 's')).toBeTruthy();

        startDate = moment('2021-12-07T20:44:00.000Z', moment.ISO_8601);
        rounded = AdHocSessionService.roundStartTime(startDate);
        expect(rounded.isSame('2021-12-07T20:30:00.000Z', 's')).toBeTruthy();

        startDate = moment('2021-12-07T20:49:00.000Z', moment.ISO_8601);
        rounded = AdHocSessionService.roundStartTime(startDate);
        expect(rounded.isSame('2021-12-07T20:45:00.000Z', 's')).toBeTruthy();
    });

    it('should round durations to 15 minute intervals', () => {
        expect(AdHocSessionService.roundDuration(0)).toEqual(15);
        expect(AdHocSessionService.roundDuration(1)).toEqual(15);
        expect(AdHocSessionService.roundDuration(14)).toEqual(15);
        expect(AdHocSessionService.roundDuration(15)).toEqual(15);
        expect(AdHocSessionService.roundDuration(16)).toEqual(30);
        expect(AdHocSessionService.roundDuration(30)).toEqual(30);
    });

    const tz = 'America/Los_Angeles';
    const instructor1 = testUsersByUsername['instructor1'].user_id;
    const participants = [
        testUsersByUsername['test1'].user_id,
        testUsersByUsername['test2'].user_id,
        testUsersByUsername['test3'].user_id,
    ];

    it('should schedule a session with given start time etc', async () => {
        let startTime = moment('2021-12-07T20:01:00.000Z', moment.ISO_8601);
        let session = await AdHocSessionService.scheduleSession(
            'A test session',
            AdHocSessionType.ResearchInformation,
            startTime,
            tz,
            58,
            instructor1,
            participants
        );
        expect(
            moment(session.scheduledStartTime).isSame(
                '2021-12-07T20:00:00.000Z',
                's'
            )
        ).toBeTruthy();
        expect(
            moment(session.scheduledEndTime).isSame(
                '2021-12-07T21:00:00.000Z',
                's'
            )
        ).toBeTruthy();
    });

    it('should get an existing session', async () => {
        const startTime = moment('2021-12-07T20:01:00.000Z', moment.ISO_8601);
        const session = await AdHocSessionService.scheduleSession(
            'A test session',
            AdHocSessionType.ResearchInformation,
            startTime,
            'America/Los_Angeles',
            58,
            testUsersByUsername['instructor1'].user_id,
            [
                testUsersByUsername['test1'].user_id,
                testUsersByUsername['test2'].user_id,
            ]
        );
        const existingSession = await AdHocSessionService.getSession(
            session.acronym
        );
        expect(existingSession).toBeTruthy();
    });

    it('should return null on invalid session', async () => {
        const startTime = moment('2021-12-07T20:01:00.000Z', moment.ISO_8601);
        const session = await AdHocSessionService.scheduleSession(
            'A test session',
            AdHocSessionType.ResearchInformation,
            startTime,
            'America/Los_Angeles',
            58,
            testUsersByUsername['instructor1'].user_id,
            [
                testUsersByUsername['test1'].user_id,
                testUsersByUsername['test2'].user_id,
            ]
        );
        const sessionError = await AdHocSessionService.getSession(
            session.acronym + 'bogus'
        );
        expect(sessionError).toBeFalsy();
    });

    it('should reschedule an existing session', async () => {
        let startTime = moment('2021-12-07T20:01:00.000Z', moment.ISO_8601);
        let session = await AdHocSessionService.scheduleSession(
            'A test session',
            AdHocSessionType.ResearchInformation,
            startTime,
            'America/Los_Angeles',
            58,
            testUsersByUsername['instructor1'].user_id,
            [
                testUsersByUsername['test1'].user_id,
                testUsersByUsername['test2'].user_id,
            ]
        );
        startTime = moment('2021-12-08T19:48:00.000Z', moment.ISO_8601);
        const sessionRescheduled = await AdHocSessionService.rescheduleSession(
            session.acronym,
            startTime
        );
        if (!sessionRescheduled) fail('No session');
        expect(
            moment(session.scheduledStartTime).isSame(
                '2021-12-07T20:00:00.000Z',
                's'
            )
        ).toBeTruthy();

        expect(
            moment(sessionRescheduled.scheduledEndTime).isSame(
                '2021-12-08T20:45:00.000Z',
                's'
            )
        ).toBeTruthy();
    });

    it('should delete an existing session', async () => {
        let startTime = moment('2021-12-07T20:01:00.000Z', moment.ISO_8601);
        let session = await AdHocSessionService.scheduleSession(
            'A test session',
            AdHocSessionType.ResearchInformation,
            startTime,
            'America/Los_Angeles',
            58,
            testUsersByUsername['instructor1'].user_id,
            [
                testUsersByUsername['test1'].user_id,
                testUsersByUsername['test2'].user_id,
            ]
        );
        let result = await AdHocSessionService.deleteSession(session.acronym);
        expect(result.deletedCount).toEqual(1);
        result = await AdHocSessionService.deleteSession(session.acronym);
        expect(result.deletedCount).toEqual(0);
    });
});
