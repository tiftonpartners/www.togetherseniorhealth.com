require('dotenv').config();
import { ClassesController } from '../api/class.controller';
import { Auth0Token } from '../api/token.types';
import { UserInfo } from '../av/user.service';
import { Logger } from '../core/logger.service';
import { Course, CourseDoc, CourseModel } from '../db/course.db';
import { ErrorCode } from '../db/helpers';
import { ClassService } from './class.service';

const log = Logger.logger('CourseService');

/**
 * Provides additional functionality for Courses
 */
export class CourseService {
    /**
     * Get all courses
     * @param userInfo Info object from user data
     * @param program Information to update program
     */
    static async getAllCourses(
        userInfo: UserInfo,
        program?: string
    ): Promise<CourseDoc[]> {
        try {
            let query = {};

            if (userInfo) {
                query = {
                    ...query,
                    ...userInfo.getProgramsQuery(program),
                };
                const courses = await CourseModel.find(query);

                return courses;
            } else {
                throw new Error('No user info found');
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Create Course
     * @param course Information to create course
     */
    static async createCourse(
        course: Course,
        userInfo: UserInfo
    ): Promise<CourseDoc> {
        try {
            const acronym = course.acronym;
            const { programs, all } = userInfo.tokenPrograms;
            const courseDb = await CourseModel.findOne({
                acronym: acronym,
            });

            if (courseDb) {
                throw new ErrorCode(
                    `Course with acronym ${acronym} already exists`,
                    400
                );
            }

            if (!all && !programs.includes(course.program)) {
                throw new ErrorCode(
                    'User does not have permissions to create course with this program.',
                    403
                );
            }

            const courseInfo = await CourseModel.create(course);
            if (courseInfo) {
                return courseInfo;
            } else {
                throw new ErrorCode('Creating new course', 400);
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Update Course
     * @param course Information to update course
     */
    static async updateCourse(
        course: Partial<Course>,
        acronym: string,
        userInfo: UserInfo
    ): Promise<CourseDoc> {
        try {
            const { programs, all } = userInfo.tokenPrograms;

            const courseInfo = await CourseModel.findOne({ acronym: acronym });

            if (!courseInfo) {
                throw new ErrorCode(
                    'ERROR No Course with acronym ' + acronym,
                    404
                );
            }

            if (!all && !programs.includes(courseInfo.program)) {
                throw new ErrorCode(
                    'User does not have permissions to update course with this program.',
                    403
                );
            }
            const updatedCourse = await CourseModel.findOneAndUpdate(
                { acronym: acronym },
                course,
                {
                    new: true,
                    useFindAndModify: false,
                }
            );
            if (updatedCourse) {
                return updatedCourse;
            } else {
                throw new ErrorCode(
                    'ERROR No Course with acronym ' + acronym,
                    404
                );
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Delete Course
     * @param course Information to update course
     */
    static async deleteCourse(
        acronym: string,
        userInfo: UserInfo
    ): Promise<CourseDoc> {
        try {
            const { programs, all } = userInfo.tokenPrograms;

            const courseInfo = await CourseModel.findOne({ acronym: acronym });

            if (!courseInfo) {
                throw new ErrorCode(
                    'ERROR No Course with acronym ' + acronym,
                    404
                );
            }

            if (!all && !programs.includes(courseInfo.program)) {
                throw new ErrorCode(
                    'User does not have permissions to delete course with this program.',
                    403
                );
            }

            const deletedClasses = await ClassService.deleteClassesByCourseId(
                courseInfo._id,
                userInfo
            );

            log.debug(
                `(deleteCourse) deleted ${
                    deletedClasses ? deletedClasses.length : 0
                } classes for this course`
            );

            const deletedCourse = await CourseModel.findOneAndDelete(
                {
                    acronym: acronym,
                },
                { useFindAndModify: false }
            );

            if (deletedCourse) {
                return deletedCourse;
            } else {
                throw new ErrorCode(
                    'ERROR No Course with acronym ' + acronym,
                    404
                );
            }
        } catch (e) {
            throw e;
        }
    }
}
