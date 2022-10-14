require('moment-recur');
require('dotenv').config();
import mongoose from 'mongoose';
import moment from 'moment';
import { getMongoConfig, TestGlobalMongoConfig } from '../config/testGlobal';
import { UserInfo } from '../../src/av/user.service';
import { buildSampleAdHocSessions } from '../../src/seed/adhoc-sessions.sample';
import { AdHocSessionService } from '../../src/service/adhoc-session.service';
import { buildParticipantUserSeedData } from '../../src/seed/participants.sample';
import { ParticipantUserModel } from '../../src/db/user.db';
import { AdHocSessionType } from '../../src/db/session.db';

let mongoConfig = new TestGlobalMongoConfig();

const UserInfoWithAllPrograms = new UserInfo(
    {
        iss: '',
        sub: '',
        aud: '',
        iat: '',
        exp: '',
        azp: '',
        scope: '',
        gty: '',
        permissions: [],
        'https://t1.tsh.com/programs': '*',
        'https://t1.tsh.com/nickname': 'Test',
        'https://t1.tsh.com/name': 'Test',
        'https://t1.tsh.com/': '/',
    },
    1
);

const UserInfoWithOneProgram = new UserInfo(
    {
        iss: '',
        sub: '',
        aud: '',
        iat: '',
        exp: '',
        azp: '',
        scope: '',
        gty: '',
        permissions: [],
        'https://t1.tsh.com/programs': 'RS',
        'https://t1.tsh.com/nickname': 'Test',
        'https://t1.tsh.com/name': 'Test',
        'https://t1.tsh.com/': '/',
    },
    1
);

describe('AdhocSessionService Tests', () => {
    beforeEach(async () => {
        mongoConfig = await getMongoConfig();
        await mongoose.connect(mongoConfig.mongoUri, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
        });
        await buildParticipantUserSeedData();
        await buildSampleAdHocSessions();
        await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    afterEach(async () => {
        if (mongoose && mongoose.connection && mongoose.connection.db) {
            await mongoose.connection.db.dropDatabase();
        }
        await mongoose.connection.close();
    });

    it('should get all adhoc sessions', async () => {
        const sessions = await AdHocSessionService.getAllAdhocSessions(
            UserInfoWithAllPrograms
        );

        if (!sessions) {
            fail('No sessions found');
        }

        expect(sessions).toBeTruthy();
        expect(sessions.length).toEqual(7);
    });

    it('should get all adhoc sessions, filtered by programs', async () => {
        const sessions = await AdHocSessionService.getAllAdhocSessions(
            UserInfoWithAllPrograms,
            'RS'
        );

        if (!sessions) {
            fail('No sessions found');
        }

        expect(sessions).toBeTruthy();
        expect(sessions.length).toEqual(3);
    });

    it('should get an adhoc session by acronym', async () => {
        const sessions = await AdHocSessionService.getSession(
            'AHTESTSESSION10'
        );

        if (!sessions) {
            fail('No sessions found');
        }

        expect(sessions).toBeTruthy();
    });

    it('should get upcoming sessions by userId and time', async () => {
        const dayOf = '2021-10-01T00:00:00.000Z';

        const participantOne = await ParticipantUserModel.findOne({
            screenName: 'participantOne',
        });
        if (participantOne) {
            const sessions = await AdHocSessionService.getUpcomingSessions(
                participantOne.userId,
                moment(dayOf)
            );

            if (!sessions) {
                fail('No sessions found');
            }

            expect(sessions).toBeDefined();
            expect(sessions.length).toBe(1);

            const dayAfter = '2021-10-02T00:00:00.000Z';
            const sessionsAfter = await AdHocSessionService.getUpcomingSessions(
                participantOne.userId,
                moment(dayAfter)
            );

            expect(sessionsAfter).toBeDefined();
            expect(sessionsAfter.length).toBe(0);
        }
        return;
    });

    it('should delete a session', async () => {
        const deleted = await AdHocSessionService.deleteSession(
            'AHTESTSESSION10'
        );

        expect(deleted).toBeDefined();
        expect(deleted.ok).toBe(1);
        expect(deleted.deletedCount).toBe(1);

        const nonExistent = await AdHocSessionService.deleteSession(
            'someacronymthatdoesnotexist'
        );

        expect(nonExistent).toBeDefined();
        expect(nonExistent.ok).toBe(1);
        expect(nonExistent.deletedCount).toBe(0);
    });

    it('should schedule an adhoc session', async () => {
        const startTime = moment('2021-10-01T00:00:00.000Z');

        const participantOne = await ParticipantUserModel.findOne({
            screenName: 'participantOne',
        });

        if (participantOne) {
            const session = await AdHocSessionService.scheduleSession(
                'My little scheduled session',
                AdHocSessionType.ResearchInformation,
                startTime,
                'America/Los_Angeles',
                60,
                'instructorId1',
                [participantOne.userId],
                'Notes'
            );

            expect(session).toBeDefined();
            expect(session.scheduledStartTime.toISOString()).toEqual(
                startTime.toISOString()
            );
        } else {
            fail('No participant');
        }
    });

    it('should reschedule an adhoc session', async () => {
        const originalTime = moment('2021-10-01T17:00:00.000Z');
        const newTime = moment('2021-10-07T22:00:00.000Z');

        const session = await AdHocSessionService.getSession('AHTESTSESSION10');

        if (!session) fail('Session not found');

        expect(moment(session.scheduledStartTime).toISOString()).toEqual(
            originalTime.toISOString()
        );

        const participantOne = await ParticipantUserModel.findOne({
            screenName: 'participantOne',
        });

        if (participantOne) {
            const newSession = await AdHocSessionService.rescheduleSession(
                'AHTESTSESSION10',
                newTime
            );

            if (!newSession) fail('Session not found');

            expect(newSession).toBeDefined();
            expect(newSession.scheduledStartTime.toISOString()).toEqual(
                newTime.toISOString()
            );
            expect(
                newSession.participants.includes(participantOne.userId)
            ).toBeTruthy();
        } else {
            fail('No participant');
        }
    });

    it('should get a schedule based on a date range', async () => {
        const startTime = moment('2021-10-01T19:00:00.000Z');
        const endTime = moment('2021-10-01T22:00:00.000Z');
        const sessions = await AdHocSessionService.getSessionSchedule(
            UserInfoWithAllPrograms,
            startTime,
            endTime,
            AdHocSessionType.ResearchInformation
        );

        if (!sessions) fail('Sessions not found');

        expect(sessions).toBeDefined();
        expect(sessions.length).toEqual(3);

        const sessionsFilteredByProgram =
            await AdHocSessionService.getSessionSchedule(
                UserInfoWithOneProgram,
                startTime,
                endTime,
                AdHocSessionType.ResearchInformation
            );

        if (!sessionsFilteredByProgram) fail('Sessions not found');

        expect(sessionsFilteredByProgram).toBeDefined();
        expect(sessionsFilteredByProgram.length).toEqual(1);
    });
});
