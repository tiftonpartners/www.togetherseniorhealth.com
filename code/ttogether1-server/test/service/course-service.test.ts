require('moment-recur');
require('dotenv').config();
import mongoose from 'mongoose';
import { getMongoConfig, TestGlobalMongoConfig } from '../config/testGlobal';
import { buildCourseSeedData } from '../../src/seed/course.sample';
import { buildParticipantUserSeedData } from '../../src/seed/participants.sample';
import { CourseService } from '../../src/service/course.service';
import testToken1 from '../data/test-token.json';
import { UserService } from '../../src/av/user.service';

let mongoConfig = new TestGlobalMongoConfig();

describe('CourseService Tests', () => {
    beforeEach(async () => {
        mongoConfig = await getMongoConfig();
        await mongoose.connect(mongoConfig.mongoUri, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
        });
        await buildParticipantUserSeedData();
        await buildCourseSeedData(null, true);
    });

    afterEach(async () => {
        if (mongoose && mongoose.connection && mongoose.connection.db) {
            await mongoose.connection.db.dropDatabase();
        }
        await mongoose.connection.close();
    });

    it('should get all courses', async () => {
        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info found');

        const courses = await CourseService.getAllCourses(userInfo);

        expect(courses).toBeTruthy();
        expect(courses.length).toEqual(3);

        const noCoursesUser = await UserService.rememberUser({
            ...testToken1,
            sub: 'auth0|5f15a837965b8c0019fe1111',
            'https://t1.tsh.com/programs': '',
        });

        if (!noCoursesUser) throw new Error('No user info found');

        await expect(
            CourseService.getAllCourses(noCoursesUser)
        ).rejects.toThrowError(
            'Not authorized to see program specific information'
        );
    });

    it('should create a course', async () => {
        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info found');

        const course = await CourseService.createCourse(
            {
                name: 'MovingTogether (Standing)',
                description: 'Moving Together, Standing',
                acronym: 'MTSTAND15',
                state: 'open',
                program: 'RS',
            },
            userInfo
        );

        expect(course).toBeTruthy();
        expect(course.name).toEqual('MovingTogether (Standing)');
        expect(course.acronym).toEqual('MTSTAND15');
    });

    it('should not create a course with a program the user is not assigned to', async () => {
        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info found');

        await expect(
            CourseService.createCourse(
                {
                    name: 'MovingTogether (Standing)',
                    description: 'Moving Together, Standing',
                    acronym: 'MTSTAND15',
                    state: 'open',
                    program: 'SUTP',
                },
                userInfo
            )
        ).rejects.toThrow(
            'User does not have permissions to create course with this program.'
        );
    });

    it('should update a course', async () => {
        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info found');

        const course = await CourseService.createCourse(
            {
                name: 'MovingTogether (Standing)',
                description: 'Moving Together, Standing',
                acronym: 'MTSTAND15',
                state: 'open',
                program: 'RS',
            },
            userInfo
        );

        expect(course).toBeTruthy();
        expect(course.name).toEqual('MovingTogether (Standing)');
        expect(course.acronym).toEqual('MTSTAND15');

        const courseUpdated = await CourseService.updateCourse(
            {
                description: 'Moving Together, Standing UPDATED',
            },
            'MTSTAND15',
            userInfo
        );

        expect(courseUpdated).toBeTruthy();
        expect(courseUpdated.description).toEqual(
            'Moving Together, Standing UPDATED'
        );
        expect(courseUpdated.acronym).toEqual('MTSTAND15');
    });

    it('should not update a course with a program the user is not assigned to', async () => {
        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info found');

        const course = await CourseService.createCourse(
            {
                name: 'MovingTogether (Standing)',
                description: 'Moving Together, Standing',
                acronym: 'MTSTAND15',
                state: 'open',
                program: 'RS',
            },
            userInfo
        );

        expect(course).toBeTruthy();
        expect(course.name).toEqual('MovingTogether (Standing)');
        expect(course.acronym).toEqual('MTSTAND15');

        const userInfo2 = await UserService.rememberUser({
            ...testToken1,
            sub: 'auth0|5f15a837965b8c0019fe1111',
            'https://t1.tsh.com/programs': 'CS',
        });

        if (!userInfo2) throw new Error('No user info found');

        await expect(
            CourseService.updateCourse(
                {
                    description: 'Moving Together, Standing UPDATED',
                },
                'MTSTAND15',
                userInfo2
            )
        ).rejects.toThrow(
            'User does not have permissions to update course with this program.'
        );
    });

    it('should delete a course', async () => {
        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info found');

        const course = await CourseService.createCourse(
            {
                name: 'MovingTogether (Standing)',
                description: 'Moving Together, Standing',
                acronym: 'MTSTAND15',
                state: 'open',
                program: 'RS',
            },
            userInfo
        );

        expect(course).toBeTruthy();

        const courseDeleted = await CourseService.deleteCourse(
            'MTSTAND15',
            userInfo
        );

        expect(courseDeleted).toBeTruthy();
    });

    it('should not delete a course with a program the user is not assigned to', async () => {
        const userInfo = await UserService.rememberUser(testToken1);

        if (!userInfo) throw new Error('No user info found');

        const course = await CourseService.createCourse(
            {
                name: 'MovingTogether (Standing)',
                description: 'Moving Together, Standing',
                acronym: 'MTSTAND15',
                state: 'open',
                program: 'RS',
            },
            userInfo
        );

        expect(course).toBeTruthy();

        const userInfo2 = await UserService.rememberUser({
            ...testToken1,
            sub: 'auth0|5f15a837965b8c0019fe1111',
            'https://t1.tsh.com/programs': 'CS',
        });

        if (!userInfo2) throw new Error('No user info found');

        await expect(
            CourseService.deleteCourse('MTSTAND15', userInfo2)
        ).rejects.toThrow(
            'User does not have permissions to delete course with this program.'
        );
    });
});
