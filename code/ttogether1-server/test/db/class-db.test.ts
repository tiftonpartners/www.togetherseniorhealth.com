import mongoose from 'mongoose';
import { ClassModel } from '../../src/db/class.db';
import { CourseModel } from '../../src/db/course.db';
import { ClassSessionModel } from '../../src/db/session.db';
import { getMongoConfig, TestGlobalMongoConfig } from '../config/testGlobal';
import { TestUserService } from '../utility/test-users.service';
import sampleCourses from '../../src/seed/sample-courses.json';

require('moment-recur');
require('dotenv').config();

let mongoConfig = new TestGlobalMongoConfig();
const testUsersByUsername = TestUserService.getAllTestUsersByUsername();

describe('ClassDb Tests', () => {
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

    it('should Create a sample class', async () => {
        const sampleCourse = sampleCourses[0];
        const course = new CourseModel();
        Object.assign(course, sampleCourse);
        await course.save();

        const sampleClass = sampleCourse.classes[0];
        const acronym = course.acronym + sampleClass.acronym;
        const instructorId =
            testUsersByUsername[sampleClass.instructor].user_id;

        if (!instructorId) fail('No instructor id');

        // Check participants
        const newClass = new ClassModel();
        Object.assign(newClass, sampleClass);
        newClass.participants = sampleClass.participants
            .map((p) => {
                if (typeof p === 'string') {
                    return testUsersByUsername[p].user_id;
                }

                return false;
            })
            .filter(Boolean) as string[];
        for (const f of [
            'durationMins',
            'lobbyTimeMins',
            'numSessions',
            'capacity',
        ]) {
            // @ts-ignore
            newClass[f] = course[f];
        }
        newClass.courseId = course._id;
        newClass.name = course.name + ' - Group 1';
        newClass.acronym = acronym;
        newClass.instructorId = instructorId;
        newClass.program = sampleCourse.program;
        await newClass.buildSessionsFromSchedule();
        await newClass.save();

        let seq = 1;
        for (const session of newClass.sessions) {
            // Check fields specific to class sessions
            expect(session.seq).toEqual(seq++);
            expect(session.classId).toEqual(newClass._id.toString());
            // Check the type of the session object to be a class session
            expect(session.__t).toEqual(ClassSessionModel.modelName);
        }

        // Check a specific session
        expect(newClass.sessions.length).toEqual(24);
        const session = newClass.findSessionByAcronym('MTSTANDG1-211206');

        if (session) {
            expect(session).toBeTruthy();
            expect(session.acronym).toEqual('MTSTANDG1-211206');
            expect(session.durationMins).toEqual(sampleCourse.durationMins);
            expect(session.instructorId).toEqual(
                testUsersByUsername[sampleClass.instructor].user_id
            );

            const courses = await CourseModel.find();
            expect(courses.length).toEqual(1);
            const classes = await ClassModel.find();
            expect(classes.length).toEqual(1);
        } else {
            fail('No session found');
        }
    });
});
