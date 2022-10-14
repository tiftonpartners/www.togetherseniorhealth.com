import mongoose from 'mongoose';
import { ClassModel } from '../../src/db/class.db';
import { CourseModel } from '../../src/db/course.db';
import { buildCourseSeedData } from '../../src/seed/course.sample';
import { buildParticipantUserSeedData } from '../../src/seed/participants.sample';
import { TestGlobalMongoConfig, getMongoConfig } from '../config/testGlobal';

require('moment-recur');
require('dotenv').config();

let mongoConfig = new TestGlobalMongoConfig();

describe('Mongoose - Basic', () => {
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

    it('should start in-memory MongoDb', async () => {});

    it('should build sample courses and classes', async () => {
        await buildParticipantUserSeedData();
        await buildCourseSeedData(null);
        const courses = await CourseModel.find();
        const classes = await ClassModel.find();
        expect(courses.length).toEqual(3);
        expect(classes.length).toEqual(8);
    });
});
