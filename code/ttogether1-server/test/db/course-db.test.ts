require('moment-recur');
require('dotenv').config();
import mongoose from 'mongoose';
import { CourseModel } from '../../src/db/course.db';
import { TestGlobalMongoConfig, getMongoConfig } from '../config/testGlobal';

let mongoConfig = new TestGlobalMongoConfig();

describe('CourseDb Tests', () => {
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

    it('should Create a course', async () => {
        let course = new CourseModel();
        course.name = 'Test Course 1';
        course.description = 'This is the description for the course';
        course.acronym = 'TSTCOURSE1';
        course = await course.save();
        expect(course.name).toBeTruthy();
        expect(course.createdOn).toBeTruthy();
        expect(course.createdOn instanceof Date).toBeTruthy();
    });
});
