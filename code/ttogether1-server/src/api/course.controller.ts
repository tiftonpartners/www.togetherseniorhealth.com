import { Request, Response } from 'express';
import { Logger } from '../core/logger.service';
import { AuthController } from './auth.controller';
import { Course, CourseModel } from '../db/course.db';
import { CourseService } from '../service/course.service';
require('dotenv').config();

/**
 * Controller to implement REST API for Courses in MongoDB
 */
export class CoursesController extends AuthController {
    /**
     * Get all courses
     * @param req
     * @param res
     */
    static apiGetAllCourses = async (
        req: Request<
            any,
            any,
            {
                program: string;
            }
        >,
        res: Response
    ) => {
        try {
            const courses = await CourseService.getAllCourses(
                res.locals.userInfo,
                req.query.program as string
            );
            res.json(courses);
        } catch (e) {
            res.status(e.status || 500).send(
                'ERROR (CourseService): ' + e.message
            );
        }
    };

    /**
     * Creating course
     * @returns Created course
     */
    static apiCreateCourse = async (
        req: Request<any, any, Course>,
        res: Response
    ) => {
        try {
            const payload = req.body;

            const course = await CourseService.createCourse(
                payload,
                res.locals.userInfo
            );
            res.status(200).json(course);
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Update information about a course given unique acronym
     * @returns Course with updated info
     */
    static apiUpdateCourseByAcronym = async (
        req: Request<{ acronym: string }, any, Partial<Course>>,
        res: Response
    ) => {
        try {
            const acronym = req.params.acronym;
            const payload = req.body;

            const course = await CourseService.updateCourse(
                payload,
                acronym,
                res.locals.userInfo
            );
            res.status(200).json(course);
        } catch (e) {
            res.status(e.status || 500).send(
                'ERROR (CourseService): ' + e.message
            );
        }
    };

    /**
     * Delete information about a course given unique acronym
     * @returns Course that was deleted
     */
    static apiDeleteCourseByAcronym = async (
        req: Request<{ acronym: string }, any, any>,
        res: Response
    ) => {
        try {
            const acronym = req.params.acronym;

            const deleted = await CourseService.deleteCourse(
                acronym,
                res.locals.userInfo
            );
            res.status(200).json(deleted);
        } catch (e) {
            res.status(e.status || 500).send(
                'ERROR (CourseService): ' + e.message
            );
        }
    };
}
