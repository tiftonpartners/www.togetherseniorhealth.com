require('moment-recur');
require('dotenv').config();
import mongoose from 'mongoose';
import { getMongoConfig, TestGlobalMongoConfig } from '../config/testGlobal';
import { buildCourseSeedData } from '../../src/seed/course.sample';
import { buildParticipantUserSeedData } from '../../src/seed/participants.sample';
import moment from 'moment';
import { ClassService } from '../../src/service/class.service';
import {
    ClassDoc,
    ClassModel,
    combineDateTime,
    getLocalTimeFrom0Z,
    Schedule,
} from '../../src/db/class.db';
import { UserService } from '../../src/av/user.service';
import testToken1 from '../data/test-token.json';
import { ParticipantUserModel } from '../../src/db/user.db';
import { updateUserClassSeedData } from '../../src/seed/users.migrate';

let mongoConfig = new TestGlobalMongoConfig();

describe('ClassService Tests', () => {
    beforeEach(async () => {
        mongoConfig = await getMongoConfig();
        await mongoose.connect(mongoConfig.mongoUri, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
        });
        await buildParticipantUserSeedData();
        await buildCourseSeedData(null, true);
        await updateUserClassSeedData();
    });

    afterEach(async () => {
        if (mongoose && mongoose.connection && mongoose.connection.db) {
            await mongoose.connection.db.dropDatabase();
        }
        await mongoose.connection.close();
    });

    it('should read classes with single upcoming session', async () => {
        const participantOne = await ParticipantUserModel.findOne({
            sid: '1011',
        });

        if (!participantOne) throw new Error('No participant found');

        const userInfo = await UserService.rememberUser({
            ...testToken1,
            sub: participantOne.userId,
        });
        expect(userInfo).toBeTruthy();

        // @ts-ignore
        const userId = userInfo.userId;
        const t = moment('2021-12-06T21:00:00.000Z').utc();

        const classes = await ClassService.getUpcomingClasses(userId, t);

        expect(classes).toBeTruthy();
    });

    it('should get all classes by course acronym', async () => {
        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info found');

        const classes = await ClassService.getAllClassesByCourseAcronym(
            userInfo,
            'MTSTAND'
        );

        expect(classes).toBeTruthy();
        expect(classes.length).toEqual(4);
    });

    it('should get class by class acronym', async () => {
        const klass = await ClassService.getClassByAcronym('MTSTANDG3');

        expect(klass).toBeTruthy();
        expect(klass?.acronym).toEqual('MTSTANDG3');
    });

    it('should get class by class id', async () => {
        const klass = await ClassService.getClassByAcronym('MTSTANDG3');

        expect(klass).toBeTruthy();

        const sameKlass = (await ClassService.getClassById(
            klass?._id
        )) as ClassDoc;

        expect(sameKlass?.name).toEqual(klass?.name);
    });

    it('should get class by session acronym', async () => {
        const participantOne = await ParticipantUserModel.findOne({
            sid: '1011',
        });

        if (!participantOne) throw new Error('No participant found');

        const userInfo = await UserService.rememberUser({
            ...testToken1,
            sub: participantOne.userId,
        });

        if (!userInfo) throw new Error('No user info found');

        const klass = await ClassService.getClassBySessionAcronym(
            'MTSTANDG3-211208',
            userInfo
        );

        expect(klass).toBeTruthy();
    });

    it('should delete a class by class acronym', async () => {
        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info found');

        const klass = await ClassService.deleteClassByAcronym(
            'MTSTANDG3',
            userInfo
        );

        expect(klass).toBeTruthy();

        await expect(
            ClassService.getClassByAcronym('MTSTANDG3')
        ).rejects.toThrowError('No class with acronym "MTSTANDG3"');
    });

    it('should not delete a class by class acronym with a program the user is not assigned to', async () => {
        const userInfo = await UserService.rememberUser({
            ...testToken1,
            sub: 'auth0|5f15a837965b8c0019fe1111',
            'https://t1.tsh.com/programs': 'CS',
        });

        if (!userInfo) throw new Error('No user info found');

        await expect(
            ClassService.deleteClassByAcronym('MTSTANDG3', userInfo)
        ).rejects.toThrow(
            'User does not have permissions to delete class with this program.'
        );
    });

    it('should delete a class by class id', async () => {
        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info found');

        const klass = await ClassService.getClassByAcronym('MTSTANDG2');

        expect(klass).toBeTruthy();

        await ClassService.deleteClassById(klass?._id, userInfo);

        await expect(
            ClassService.getClassByAcronym('MTSTANDG2')
        ).rejects.toThrowError('No class with acronym "MTSTANDG2"');
    });

    it('should not delete a class by id with a program the user is not assigned to', async () => {
        const userInfo = await UserService.rememberUser({
            ...testToken1,
            sub: 'auth0|5f15a837965b8c0019fe1111',
            'https://t1.tsh.com/programs': 'CS',
        });

        if (!userInfo) throw new Error('No user info found');

        const klass = await ClassService.getClassByAcronym('MTSTANDG2');

        expect(klass).toBeTruthy();

        await expect(
            ClassService.deleteClassById(klass?._id, userInfo)
        ).rejects.toThrow(
            'User does not have permissions to delete class with this program.'
        );
    });

    it('should get all classes for a user', async () => {
        const participantOne = await ParticipantUserModel.findOne({
            sid: '1011',
        });

        if (!participantOne) throw new Error('No participant found');

        const classes = await ClassService.getUserClasses(
            participantOne.userId
        );

        expect(classes).toBeTruthy();
        expect(classes.length).toEqual(3);
    });

    it('should get all classes for a user with course names', async () => {
        const participantOne = await ParticipantUserModel.findOne({
            sid: '1011',
        });

        if (!participantOne) throw new Error('No participant found');

        const classes = await ClassService.getUserClassesWithCourseNames(
            participantOne.userId
        );

        expect(classes).toBeTruthy();
        expect(classes.length).toEqual(3);
        expect(classes[0].courseName).toBeDefined();
    });

    it('should update a class', async () => {
        const participantOne = await ParticipantUserModel.findOne({
            sid: '1011',
        });

        if (!participantOne) throw new Error('No participant found');

        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info found');

        const klass = await ClassService.updateClass(
            {
                acronym: 'MTSTANDG2',
                name: 'UPDATED',
            },
            'MTSTAND',
            userInfo
        );

        expect(klass).toBeTruthy();
        expect(klass.name).toEqual('UPDATED');
    });

    it('should not update a class with a program the user is not assigned to', async () => {
        const participantOne = await ParticipantUserModel.findOne({
            sid: '1011',
        });

        if (!participantOne) throw new Error('No participant found');

        const userInfo = await UserService.rememberUser({
            ...testToken1,
            sub: 'auth0|5f15a837965b8c0019fe1111',
            'https://t1.tsh.com/programs': 'CS',
        });

        if (!userInfo) throw new Error('No user info found');
        await expect(
            ClassService.updateClass(
                {
                    acronym: 'MTSTANDG2',
                    name: 'UPDATED',
                },
                'MTSTAND',
                userInfo
            )
        ).rejects.toThrow(
            'User does not have permissions to update class with this program.'
        );
    });

    it('should add user to a class', async () => {
        const participantOne = await ParticipantUserModel.findOne({
            sid: '1011',
        });

        if (!participantOne) throw new Error('No participant found');

        const klass = await ClassService.getClassByAcronym('MTSTANDG2');

        if (!klass) throw new Error('No class found');

        const response = await ClassService.addUserToClassById(
            klass._id,
            participantOne.userId
        );

        if (!response) throw new Error('No response');

        expect(response).toBeTruthy();
        expect(response.user?.screenName).toEqual(participantOne.screenName);

        if (!response.class) throw new Error('No response class');

        expect(
            response.class.participants.includes(participantOne.userId)
        ).toBeTruthy();

        const participantEight = await ParticipantUserModel.findOne({
            sid: '1018',
        });

        if (!participantEight) throw new Error('No participant found');

        const klass2 = await ClassService.getClassByAcronym('MTSTANDG2');

        if (!klass2) throw new Error('No class found');

        const response2 = await ClassService.addUserToClassById(
            klass2._id,
            participantEight.userId
        );

        if (!response2) throw new Error('No response');

        expect(response2).toBeTruthy();
        expect(response2.crossProgram).toBeTruthy();
    });

    it('should remove a user from a class', async () => {
        const participantOne = await ParticipantUserModel.findOne({
            sid: '1011',
        });

        if (!participantOne) throw new Error('No participant found');

        const klass = await ClassService.getClassByAcronym('MTSTANDG3');

        if (!klass) throw new Error('No class found');

        const response = await ClassService.removeUserFromClassById(
            klass._id,
            participantOne.userId
        );

        if (!response) throw new Error('No response');

        expect(response).toBeTruthy();
        expect(response.user?.screenName).toEqual(participantOne.screenName);

        if (!response.class) throw new Error('No response class');

        expect(
            response.class.participants.includes(participantOne.userId)
        ).toBeFalsy();
    });
    it('should combine dates and times correctly', () => {
        const date0Z = '2021-12-06T00:00:00.000Z';
        const startTime = '2021-12-06T21:00:00.000Z';

        const combineDated = combineDateTime(date0Z, startTime);

        expect(combineDated).toBeTruthy();
        expect(combineDated.toISOString()).toEqual('2021-12-06T21:00:00.000Z');
    });

    it('should get local time from UTC', () => {
        const date0Z = '2021-12-06';
        const localTime = getLocalTimeFrom0Z(date0Z, {
            hour: 13,
            mins: 0,
            tz: 'America/Los_Angeles',
        });

        expect(localTime).toBeTruthy();
        expect(localTime.zoneName()).toBe('PST');
        expect(localTime.toISOString()).toBe('2021-12-06T21:00:00.000Z');
    });

    it('should create a class', async () => {
        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info found');

        const klass = await ClassService.createClass(
            {
                waitlisting: false,
                lobbyTimeMins: 15,
                instructorId: 'auth0|5f1f7dd331a1220037f98ecd',
                name: 'Unscheduled Class 1',
                acronym: 'TEST1',
            },
            'MTSIT',
            userInfo
        );
        expect(klass).toBeDefined();
        expect(klass._id).toBeDefined();
        expect(klass.acronym).toBe('MTSITTEST1');
    });

    it('should not create a class with a program the user is not assigned to', async () => {
        const userInfo = await UserService.rememberUser({
            ...testToken1,
            sub: 'auth0|5f15a837965b8c0019fe1111',
            'https://t1.tsh.com/programs': 'CS',
        });

        if (!userInfo) throw new Error('No user info found');

        await expect(
            ClassService.createClass(
                {
                    waitlisting: false,
                    lobbyTimeMins: 15,
                    instructorId: 'auth0|5f1f7dd331a1220037f98ecd',
                    name: 'Unscheduled Class 1',
                    acronym: 'TEST1',
                },
                'MTSIT',
                userInfo
            )
        ).rejects.toThrow(
            'User does not have permissions to create class with this program.'
        );
    });

    it('should not allow two classes with same acronym', async () => {
        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info found');

        await expect(
            ClassService.createClass(
                {
                    waitlisting: false,
                    lobbyTimeMins: 15,
                    instructorId: 'auth0|5f1f7dd331a1220037f98ecd',
                    name: 'Duplicate class',
                    acronym: 'G1',
                },
                'MTSTAND',
                userInfo
            )
        ).rejects.toThrow(`Class with acronym MTSTANDG1 already exists`);
    });

    it('should schedule from a time and schedule', async () => {
        const startDate0Z = '2022-04-18';
        const on = moment('2022-04-19T02:00:00.000Z', moment.ISO_8601);
        const tz = 'America/Los_Angeles';

        const onTz = moment(on).tz(tz);

        const klass = await ClassModel.findOne({
            acronym: 'MTSTANDG4',
        });

        expect(klass).toBeDefined();

        const schedule = {
            weekdays: ['mon', 'wed'],
            startTime: {
                hour: onTz.hours(),
                mins: onTz.minutes(),
                tz: tz,
            },
        } as Schedule;

        // overwrite with new sessions
        const classWithSessions = await ClassService.scheduleSessions({
            ...klass?.toObject(),
            capacity: 8,
            durationMins: 60,
            schedule,
            startDate0Z,
            numSessions: 12,
        });

        expect(classWithSessions.sessions).toBeDefined();
        expect(classWithSessions.sessions.length).toBe(12);

        const first = classWithSessions.sessions[0];
        expect(first.date0Z).toBe('2022-04-18'); // saved as local tz date
        expect(moment(first.date0Z).format('dddd')).toBe('Monday');
        expect(moment(first.scheduledStartTime).isSame(on)).toBeTruthy();
        expect(
            moment(first.scheduledEndTime).isSame(on.add(1, 'h'))
        ).toBeTruthy();
    });

    it('should update date / time properties when rescheduling by start date', async () => {
        // first day of MTSTANDG1 test class, 2021-12-06 13:00 Pacific time
        // original scheduled start time: '2021-12-06T21:00:00.000Z'
        const changeDate0Z = '2021-12-07T00:00:00.000Z';
        const on = moment(changeDate0Z, moment.ISO_8601);
        const tz = 'America/Los_Angeles';

        const onTz = moment(on).tz(tz);

        // overwrite with new sessions
        const classWithSessions = await ClassService.rescheduleSession(
            {
                date0Z: changeDate0Z,
            },
            'MTSTANDG1-211206'
        );

        expect(classWithSessions.sessions).toBeDefined();
        expect(classWithSessions.sessions.length).toBe(24);

        const first = classWithSessions.sessions[0];
        expect(first.date0Z).toBe('2021-12-07');
        expect(first.scheduledStartTime.toISOString()).toBe(
            '2021-12-07T21:00:00.000Z'
        );
        expect(first.scheduledEndTime.toISOString()).toBe(
            moment('2021-12-07T21:00:00.000Z').add(1, 'h').toISOString()
        );
    });

    it('should update date / time properties when rescheduling by start time', async () => {
        // first day of MTSTANDG1 test class, 2021-12-06 13:00 Pacific time
        // original scheduled start time: '2021-12-06T21:00:00.000Z'
        const changeScheduledStartTime = '2021-12-06T16:00:00.000Z';
        const on = moment(changeScheduledStartTime, moment.ISO_8601);
        const tz = 'America/Los_Angeles';

        const onTz = moment(on).tz(tz);

        // overwrite with new sessions
        const classWithSessions = await ClassService.rescheduleSession(
            {
                scheduledStartTime: changeScheduledStartTime as any,
            },
            'MTSTANDG1-211206'
        );

        expect(classWithSessions.sessions).toBeDefined();
        expect(classWithSessions.sessions.length).toBe(24);

        const first = classWithSessions.sessions[0];
        expect(first.date0Z).toBe('2021-12-06');
        expect(first.scheduledStartTime.toISOString()).toBe(
            changeScheduledStartTime
        );
        expect(first.scheduledEndTime.toISOString()).toBe(
            moment(changeScheduledStartTime).add(1, 'h').toISOString()
        );
    });

    it("should update order of sessions when a session's date is updated", async () => {
        // first day of MTSTANDG1 test class, 2021-12-06 13:00 Pacific time
        // original scheduled start time: '2021-12-06T21:00:00.000Z'
        const changeDate0Z = '2021-12-09T00:00:00.000Z';
        const on = moment(changeDate0Z, moment.ISO_8601);
        const tz = 'America/Los_Angeles';

        const onTz = moment(on).tz(tz);

        // overwrite with new sessions
        const classWithSessions = await ClassService.rescheduleSession(
            {
                date0Z: changeDate0Z,
            },
            'MTSTANDG1-211206'
        );

        expect(classWithSessions.sessions).toBeDefined();
        expect(classWithSessions.sessions.length).toBe(24);

        const first = classWithSessions.sessions[0];
        expect(first.date0Z).toBe('2021-12-08'); // was second initially, now is the first
        expect(first.scheduledStartTime.toISOString()).toBe(
            '2021-12-08T21:00:00.000Z'
        );
        expect(first.scheduledEndTime.toISOString()).toBe(
            moment('2021-12-08T21:00:00.000Z').add(1, 'h').toISOString()
        );

        const second = classWithSessions.sessions[1];
        expect(second.date0Z).toBe('2021-12-09'); // was first, got reordered
        expect(second.scheduledStartTime.toISOString()).toBe(
            '2021-12-09T21:00:00.000Z'
        );
        expect(second.scheduledEndTime.toISOString()).toBe(
            moment('2021-12-09T21:00:00.000Z').add(1, 'h').toISOString()
        );
    });

    it('should skip sessions', async () => {
        // first day of MTSTANDG1 test class, 2021-12-06 13:00 Pacific time
        // original scheduled start time: '2021-12-06T21:00:00.000Z'
        const changeDate0Z = '2021-12-09T00:00:00.000Z';
        const changeScheduledStartTime = '2021-12-09T16:00:00.000Z';

        // first reschedule the first session to be a completely different date time
        // this is will push the session to second in the list
        let classWithSessions = await ClassService.rescheduleSession(
            {
                date0Z: changeDate0Z,
                scheduledStartTime: changeScheduledStartTime as any,
            },
            'MTSTANDG1-211206'
        );

        let second = classWithSessions.sessions[1];
        expect(second.date0Z).toBe('2021-12-09'); // was first, got reordered
        expect(second.scheduledStartTime.toISOString()).toBe(
            '2021-12-09T16:00:00.000Z'
        );
        expect(second.scheduledEndTime.toISOString()).toBe(
            moment('2021-12-09T16:00:00.000Z').add(1, 'h').toISOString()
        );

        // now lets skip the new first and make sure everything is correct
        let first = classWithSessions.sessions[0];

        classWithSessions = await ClassService.rescheduleSession(
            {},
            first.acronym,
            true
        );

        // now the first session in the list, was the one we originally moved
        expect(second.date0Z).toBe('2021-12-09'); // was second, got reordered
        expect(second.scheduledStartTime.toISOString()).toBe(
            '2021-12-09T16:00:00.000Z'
        );
        expect(second.scheduledEndTime.toISOString()).toBe(
            moment('2021-12-09T16:00:00.000Z').add(1, 'h').toISOString()
        );
        expect(second.acronym).toBe('MTSTANDG1-211209');

        // and the last
        let last =
            classWithSessions.sessions[classWithSessions.sessions.length - 1];
        expect(last.date0Z).toBe('2022-02-28');
        expect(last.scheduledStartTime.toISOString()).toBe(
            '2022-02-28T21:00:00.000Z'
        );
        expect(last.scheduledEndTime.toISOString()).toBe(
            moment('2022-02-28T21:00:00.000Z').add(1, 'h').toISOString()
        );
        expect(last.acronym).toBe('MTSTANDG1-220228');
    });

    it('should delete sessions', async () => {
        const classWithSessions = await ClassService.deleteSession(
            'MTSTANDG1-211208'
        );

        expect(classWithSessions.sessions.length).toEqual(23);

        const klass = await ClassModel.findOne({
            'sessions.acronym': 'MTSTANDG1-211208',
        });

        expect(klass).toBeNull();

        const existingKlass = await ClassModel.findOne({
            'sessions.acronym': 'MTSTANDG1-211206',
        });

        if (!existingKlass) {
            throw new Error('No class found');
        }

        const firstSession = existingKlass.sessions.find((session) => {
            return session.acronym === 'MTSTANDG1-211206';
        });

        if (!firstSession) {
            throw new Error('No session found');
        }

        expect(firstSession).toBeDefined();
        expect(firstSession.seq).toEqual(1);

        const secondSession = existingKlass.sessions.find((session) => {
            return session.acronym === 'MTSTANDG1-211213';
        });

        if (!secondSession) {
            throw new Error('No session found');
        }

        expect(secondSession).toBeDefined();
        expect(secondSession.seq).toEqual(2);
    });

    it('should find upcoming classes for today', async () => {
        // first day of MTSTANDG1 test class, 2021-12-06 14:00 Pacific time
        let on = moment('2021-12-06T21:00:00.000Z', moment.ISO_8601);
        let tz = 'America/Los_Angeles';

        let onTz = moment(on).tz(tz);
        const classesToday = await ClassService.getUpcomingClassesToday(onTz);

        expect(classesToday).toBeTruthy();
        expect(classesToday.length).toEqual(1);
        expect(classesToday[0].sessions.length).toEqual(1);
        expect(classesToday[0].sessions[0].date0Z).toEqual('2021-12-06');
    });
});
