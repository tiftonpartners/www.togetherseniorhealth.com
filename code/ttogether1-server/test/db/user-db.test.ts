import { TestGlobalMongoConfig, getMongoConfig } from '../config/testGlobal';
import mongoose from 'mongoose';
import { TestUserService } from '../utility/test-users.service';
import { AgoraUserModel } from '../../src/db/user.db';
import { UserService } from '../../src/av/user.service';

require('moment-recur');
require('dotenv').config();

let mongoConfig = new TestGlobalMongoConfig();
const testUsers = TestUserService.getAllTestUsers();

describe('UsersDb Tests', () => {
    beforeEach(async () => {
        mongoConfig = await getMongoConfig();
        await mongoose.connect(mongoConfig.mongoUri, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
        });
    });

    afterEach(async () => {
        if (mongoose && mongoose.connection && mongoose.connection.db) {
            await mongoose.connection.db.dropDatabase();
        }
        await mongoose.connection.close();
    });
    it('should Create a user with sequenced userNumber', async () => {
        for (let i = 0; i < 5; i++) {
            const user = new AgoraUserModel();
            user.userId = testUsers[i].user_id;
            const updatedUser = await user.save();
            await UserService.setNextUserNumber(user);
            expect(updatedUser.userNumber).toEqual(100 + i);
        }

        const users = await AgoraUserModel.find();
        expect(users.length).toEqual(5);
    });
});
