require('moment-recur');
require('dotenv').config();
import mongoose from 'mongoose';
import moment from 'moment';
import { getMongoConfig, TestGlobalMongoConfig } from '../config/testGlobal';
import { UserService } from '../../src/av/user.service';
import { buildParticipantUserSeedData } from '../../src/seed/participants.sample';
import { updateUserClassSeedData } from '../../src/seed/users.migrate';
import {
    IneligibilityReason,
    ParticipantUserModel,
    ProspectUserModel,
    UserContactMethod,
    UserState,
    UserType,
} from '../../src/db/user.db';
import { buildProspectUserSeedData } from '../../src/seed/prospects.sample';
import testToken1 from '../data/test-token.json';
import { migrateUserData } from '../../src/seed/users.migrate';
import { AdHocSessionService } from '../../src/service/adhoc-session.service';
import { ClassService } from '../../src/service/class.service';
import { buildSampleAdHocSessions } from '../../src/seed/adhoc-sessions.sample';
import { buildCourseSeedData } from '../../src/seed/course.sample';

let mongoConfig = new TestGlobalMongoConfig();

describe('UserService Tests', () => {
    beforeEach(async () => {
        mongoConfig = getMongoConfig();
        await mongoose.connect(mongoConfig.mongoUri, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
        });
        await buildParticipantUserSeedData();
        await buildProspectUserSeedData();
        // need until we fully deprecae legacy prospects
        await migrateUserData();
        await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    afterEach(async () => {
        if (mongoose && mongoose.connection && mongoose.connection.db) {
            await mongoose.connection.db.dropDatabase();
        }
        await mongoose.connection.close();
    });

    it('should get a prospect / participant user by id', async () => {
        const participantOne = await ParticipantUserModel.findOne({
            sid: '1011',
        });

        if (!participantOne) throw new Error('No participant found');

        const avUser = await UserService.getAVUserById(participantOne.userId, [
            'get:participant',
        ]);

        expect(avUser).toBeDefined();
        expect(avUser._id).toEqual(participantOne._id);

        await expect(
            UserService.getAVUserById(
                participantOne.userId,
                ['get:prospect'],
                true
            )
        ).rejects.toThrowError(
            'Forbidden: User does not have correct permissions to retrieve this user.'
        );
    });

    it('should get a prospect user by id', async () => {
        const prospectOne = await ProspectUserModel.findOne({
            sid: '1001',
        });

        if (!prospectOne) throw new Error('No prospect found');

        const avUser = await UserService.getProspectUserById(
            prospectOne.userId
        );

        expect(avUser).toBeDefined();
        expect(avUser._id).toEqual(prospectOne._id);
    });

    it('should get a participant user by id', async () => {
        const participantOne = await ParticipantUserModel.findOne({
            sid: '1011',
        });

        if (!participantOne) throw new Error('No participant found');

        const avUser = await UserService.getParticipantUserById(
            participantOne.userId
        );

        expect(avUser).toBeDefined();
        expect(avUser._id).toEqual(participantOne._id);
    });

    it('should filter users by programs assigned to user token when querying', async () => {
        const u1 = await UserService.rememberUser(testToken1);

        expect(u1).toBeTruthy();

        if (u1) {
            const users = await UserService.getAllSiteUsers(
                u1,
                UserType.Prospect
            );
            expect(Object.keys(users).length).toEqual(15);
        }

        const u2 = await UserService.rememberUser({
            ...testToken1,
            sub: 'auth0|5f15a837965b8c0019fe1111',
            'https://t1.tsh.com/programs': 'RS',
        });

        expect(u2).toBeTruthy();

        if (u2) {
            const users = await UserService.getAllSiteUsers(
                u2,
                UserType.Prospect
            );
            expect(Object.keys(users).length).toEqual(8);
        }
    });

    it('should create a prospect user', async () => {
        const u1 = await UserService.rememberUser(testToken1);

        if (!u1) throw new Error('User info not found');

        const user = await UserService.createAVUser(
            {
                sid: '1999',
                firstName: 'Prospect',
                lastName: '9999',
                screenName: 'prospect9999',
                email: 'prospect.9999@tsh.care',
                primaryPhone: '9999999999',
                mobilePhone: '9999999999',
                streetAddress: '111 Test St.',
                city: 'Test',
                zipCode: '11111',
                caregiverFirstName: 'CG',
                caregiverLastName: 'One',
                caregiverEmail: 'cg.one@tsh.care',
                caregiverPhone: '9999999999',
                caregiverMobilePhone: '9999999999',
                caregiverStreetAddress: '111 Test St.',
                caregiverCity: 'Test',
                caregiverZipCode: '11111',
                caregiverRel: 'Family',
                caregiverContactMethod: UserContactMethod.Email,
                contactMethod: UserContactMethod.Email,
                localEmergencyPhone: '9999999999',
                primaryEmergencyPhone: '9999999999',
                secondaryEmergencyPhone: '9999999999',
                referredBy: 'Test Referrer',
                courseInterest: 'RS',
                notes: 'Notes!',
                program: 'RS',
            },
            UserType.Prospect,
            u1
        );

        if (!user) throw new Error('No prospect found');

        expect(user).toBeDefined();
    });

    it('should not allow creating a participant user with program not assigned to', async () => {
        const u1 = await UserService.rememberUser(testToken1);

        if (!u1) throw new Error('User info not found');

        await expect(
            UserService.createAVUser(
                {
                    sid: '1999',
                    firstName: 'Prospect',
                    lastName: '9999',
                    screenName: 'prospect9999',
                    email: 'prospect.9999@tsh.care',
                    primaryPhone: '9999999999',
                    mobilePhone: '9999999999',
                    streetAddress: '111 Test St.',
                    city: 'Test',
                    zipCode: '11111',
                    caregiverFirstName: 'CG',
                    caregiverLastName: 'One',
                    caregiverEmail: 'cg.one@tsh.care',
                    caregiverPhone: '9999999999',
                    caregiverMobilePhone: '9999999999',
                    caregiverStreetAddress: '111 Test St.',
                    caregiverCity: 'Test',
                    caregiverZipCode: '11111',
                    caregiverRel: 'Family',
                    caregiverContactMethod: UserContactMethod.Email,
                    contactMethod: UserContactMethod.Email,
                    localEmergencyPhone: '9999999999',
                    primaryEmergencyPhone: '9999999999',
                    secondaryEmergencyPhone: '9999999999',
                    referredBy: 'Test Referrer',
                    courseInterest: 'RS',
                    notes: 'Notes!',
                    program: 'SUTP',
                },
                UserType.Prospect,
                u1
            )
        ).rejects.toThrow(
            'User does not have permissions to create user with this program.'
        );
    });

    it('should create a participant user', async () => {
        const u1 = await UserService.rememberUser(testToken1);

        if (!u1) throw new Error('User info not found');

        const user = await UserService.createAVUser(
            {
                sid: '1999',
                firstName: 'Participant',
                lastName: '9999',
                screenName: 'participant9999',
                email: 'participant.9999@tsh.care',
                primaryPhone: '9999999999',
                mobilePhone: '9999999999',
                streetAddress: '111 Test St.',
                city: 'Test',
                zipCode: '11111',
                caregiverFirstName: 'CG',
                caregiverLastName: 'One',
                caregiverEmail: 'cg.one@tsh.care',
                caregiverPhone: '9999999999',
                caregiverMobilePhone: '9999999999',
                caregiverStreetAddress: '111 Test St.',
                caregiverCity: 'Test',
                caregiverZipCode: '11111',
                caregiverRel: 'Family',
                caregiverContactMethod: UserContactMethod.Email,
                contactMethod: UserContactMethod.Email,
                localEmergencyPhone: '9999999999',
                primaryEmergencyPhone: '9999999999',
                secondaryEmergencyPhone: '9999999999',
                referredBy: 'Test Referrer',
                courseInterest: 'RS',
                notes: 'Notes!',
                program: 'RS',
            },
            UserType.Participant,
            u1
        );

        if (!user) throw new Error('No participant found');

        expect(user).toBeDefined();
    });

    it('should not allow creating a participant user with program not assigned to', async () => {
        const u1 = await UserService.rememberUser(testToken1);

        if (!u1) throw new Error('User info not found');

        await expect(
            UserService.createAVUser(
                {
                    sid: '1999',
                    firstName: 'Participant',
                    lastName: '9999',
                    screenName: 'participant9999',
                    email: 'participant.9999@tsh.care',
                    primaryPhone: '9999999999',
                    mobilePhone: '9999999999',
                    streetAddress: '111 Test St.',
                    city: 'Test',
                    zipCode: '11111',
                    caregiverFirstName: 'CG',
                    caregiverLastName: 'One',
                    caregiverEmail: 'cg.one@tsh.care',
                    caregiverPhone: '9999999999',
                    caregiverMobilePhone: '9999999999',
                    caregiverStreetAddress: '111 Test St.',
                    caregiverCity: 'Test',
                    caregiverZipCode: '11111',
                    caregiverRel: 'Family',
                    caregiverContactMethod: UserContactMethod.Email,
                    contactMethod: UserContactMethod.Email,
                    localEmergencyPhone: '9999999999',
                    primaryEmergencyPhone: '9999999999',
                    secondaryEmergencyPhone: '9999999999',
                    referredBy: 'Test Referrer',
                    courseInterest: 'RS',
                    notes: 'Notes!',
                    program: 'SUTP',
                },
                UserType.Participant,
                u1
            )
        ).rejects.toThrow(
            'User does not have permissions to create user with this program.'
        );
    });

    it('should update a prospect user', async () => {
        const user = await ProspectUserModel.findOne({
            sid: '1001',
        });

        if (!user) throw new Error('No prospect found');

        expect(user).toBeDefined();

        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info');

        expect(userInfo).toBeDefined();

        const updatedUser = await UserService.updateAVUser(
            user.userId,
            {
                firstName: 'Updated First',
                screenName: 'Updatedscreenname',
            },
            UserType.Prospect,
            userInfo
        );

        if (!updatedUser) throw new Error('No updated prospect');

        expect(updatedUser).toBeDefined();
        expect(updatedUser.firstName).toEqual('Updated First');
        expect(updatedUser.screenName).toEqual('Updatedscreenname');
        expect(updatedUser.lastName).toEqual(user.lastName);
    });

    it('should update a participant user', async () => {
        const user = await ParticipantUserModel.findOne({
            sid: '1011',
        });

        if (!user) throw new Error('No participant found');

        expect(user).toBeDefined();

        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info');

        expect(userInfo).toBeDefined();

        const updatedUser = await UserService.updateAVUser(
            user.userId,
            {
                firstName: 'Updated First',
                screenName: 'Updatedscreenname',
            },
            UserType.Participant,
            userInfo
        );

        if (!updatedUser) throw new Error('No updated participant');

        expect(updatedUser).toBeDefined();
        expect(updatedUser.firstName).toEqual('Updated First');
        expect(updatedUser.screenName).toEqual('Updatedscreenname');
        expect(updatedUser.lastName).toEqual(user.lastName);
    });

    it('should update the passwordless ticket when the screen is updated', async () => {
        const user = await ParticipantUserModel.findOne({
            sid: '1011',
        });

        if (!user) throw new Error('No participant found');

        expect(user).toBeDefined();

        const userInfo = await UserService.rememberUser(testToken1);
        const participantUserInfo = await UserService.rememberUser(user.userId);

        if (!userInfo || !participantUserInfo) throw new Error('No user info');

        expect(userInfo).toBeDefined();
        expect(participantUserInfo).toBeDefined();
        expect(participantUserInfo.screenName).toEqual('participantOne');

        const updatedUser = await UserService.updateAVUser(
            user.userId,
            {
                firstName: 'Updated First',
                screenName: 'Updatedscreenname',
            },
            UserType.Participant,
            userInfo
        );

        if (!updatedUser) throw new Error('No updated participant');

        expect(updatedUser).toBeDefined();
        expect(updatedUser.screenName).toEqual('Updatedscreenname');
        const participantUserInfoUpdated = await UserService.fetchAuth0Info(
            participantUserInfo
        );

        expect(participantUserInfoUpdated).toBeDefined();
        expect(participantUserInfoUpdated.screenName).toEqual(
            'Updatedscreenname'
        );
    });

    it('should update a prospect to be a participant', async () => {
        const user = await ProspectUserModel.findOne({
            sid: '1001',
        });

        if (!user) throw new Error('No prospect found');

        expect(user).toBeDefined();

        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info');

        expect(userInfo).toBeDefined();

        const updatedUser = await UserService.updateAVUser(
            user.userId,
            {
                __t: UserType.Participant,
                state: UserState.NotYetAssigned,
            },
            UserType.Prospect,
            userInfo
        );

        if (!updatedUser) throw new Error('No updated participant');

        expect(updatedUser).toBeDefined();
        expect(updatedUser.__t).toEqual(UserType.Participant);
        expect(updatedUser.state).toEqual(UserState.NotYetAssigned);
    });

    it('should put a prospect / participant on hold with a reason', async () => {
        const user = await ProspectUserModel.findOne({
            sid: '1001',
        });

        if (!user) throw new Error('No prospect found');

        expect(user).toBeDefined();

        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info');

        expect(userInfo).toBeDefined();

        const updatedUser = await UserService.updateAVUser(
            user.userId,
            {
                state: UserState.Closed,
                outcome: IneligibilityReason.InadequateTechnology,
            },
            UserType.Prospect,
            userInfo
        );

        if (!updatedUser) throw new Error('No updated participant');

        expect(updatedUser).toBeDefined();
        expect(updatedUser.__t).toEqual(UserType.Prospect);
        expect(updatedUser.state).toEqual(UserState.Closed);
        expect(updatedUser.outcome).toEqual(
            IneligibilityReason.InadequateTechnology
        );
    });

    it('should delete all ad hoc sessions a user is included in when held', async () => {
        await buildSampleAdHocSessions();

        const participantOne = await ParticipantUserModel.findOne({
            sid: '1011',
        });

        if (!participantOne) throw new Error('No participant found');

        expect(participantOne).toBeDefined();

        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info');

        expect(userInfo).toBeDefined();

        const updatedUser = await UserService.updateAVUser(
            participantOne.userId,
            {
                state: UserState.Closed,
                outcome: IneligibilityReason.InadequateTechnology,
            },
            UserType.Participant,
            userInfo
        );

        if (updatedUser) {
            const dayOf = '2021-10-01T00:00:00.000Z';
            const sessions = await AdHocSessionService.getUpcomingSessions(
                participantOne.userId,
                moment(dayOf)
            );

            if (!sessions) {
                throw new Error('No sessions found');
            }

            expect(sessions).toBeDefined();
            expect(sessions.length).toBe(0);
        }
    });

    it('should remove user from class when a user is held', async () => {
        await buildCourseSeedData(null, true);
        await updateUserClassSeedData();

        const participantOne = await ParticipantUserModel.findOne({
            sid: '1011',
        });

        if (!participantOne) throw new Error('No participant found');

        expect(participantOne).toBeDefined();

        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info');

        expect(userInfo).toBeDefined();

        const updatedUser = await UserService.updateAVUser(
            participantOne.userId,
            {
                state: UserState.Closed,
                outcome: IneligibilityReason.InadequateTechnology,
            },
            UserType.Participant,
            userInfo
        );

        if (updatedUser) {
            const classes = await ClassService.getUserClasses(
                participantOne.userId
            );

            expect(classes).toBeTruthy();
            expect(classes.length).toEqual(0);
        }
    });
});
