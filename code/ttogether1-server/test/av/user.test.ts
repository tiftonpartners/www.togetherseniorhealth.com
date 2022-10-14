import {
    getMongoConfig,
    mongoGlobalTestSetup,
    mongoGlobalTestTeardown,
    TestGlobalMongoConfig,
} from '../config/testGlobal';
import mongoose from 'mongoose';
import { UserInfo, UserService } from '../../src/av/user.service';
import testToken1 from '../data/test-token.json';
jest.mock(
    'auth0',
    jest.fn().mockImplementation(() => {
        return {
            ManagementClient: jest.fn().mockImplementation(() => {
                return {
                    getUser: () => jest.fn().mockResolvedValue({}),
                };
            }),
        };
    })
);

let mongoConfig = new TestGlobalMongoConfig();

describe('User Service tests', () => {
    beforeAll(async () => {
        mongoConfig = await getMongoConfig();
    });
    afterAll(async () => {});

    beforeEach(async () => {
        await mongoGlobalTestSetup();
        await mongoose.connect(mongoConfig.mongoUri, {
            useNewUrlParser: true,
            useCreateIndex: true,
        });
    });

    afterEach(async () => {
        if (mongoose && mongoose.connection && mongoose.connection.db) {
            await mongoose.connection.db.dropDatabase();
        }
        await mongoose.connection.close();
        await mongoGlobalTestTeardown();
    });

    it('should construct a userInfo from a JWT Decoded token', () => {
        const u1 = new UserInfo(testToken1, 1000);
        expect(testToken1).toBeTruthy();
        expect(u1.hasUserData()).toBeFalsy();
        expect(u1.userId).toEqual(testToken1.sub);
    });

    it('should get user info from JWT', async () => {
        const u1 = await UserService.rememberUser(testToken1);
        expect(u1).toBeTruthy();

        if (u1) {
            expect(u1.hasUserData()).toBeTruthy();
            expect(u1.isUserNumAssigned()).toBeTruthy();
            expect(u1.userId).toEqual(testToken1.sub);
            expect(u1.userNumber).toBeGreaterThanOrEqual(1);
            expect(u1.screenName).toBeTruthy();
        }
    });

    it('should get user info from cache', async () => {
        const u1 = await UserService.rememberUser(testToken1);
        const u2 = await UserService.rememberUser(testToken1);

        expect(u1).toBeTruthy();
        expect(u2).toBeTruthy();

        if (u1 && u2) {
            expect(u1.userId).toEqual(u2.userId);
            expect(u1.userNumber).toEqual(u2.userNumber);
            expect(u1.userId).toEqual(testToken1.sub);
        }
    });
});
