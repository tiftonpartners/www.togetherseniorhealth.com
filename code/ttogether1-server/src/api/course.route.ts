import { Router } from 'express';
import { Logger } from '../core/logger.service';
import { CoursesController } from './course.controller';
import permissions from './permissions.middleware';
const log = Logger.logger('CourseRouter');
// @ts-ignore:
export const courseRouter = new Router();
try {
    courseRouter
        .route('/')
        .post(
            permissions('apiCreateCourse'),
            CoursesController.apiCreateCourse
        );
    courseRouter
        .route('/')
        .get(
            permissions('apiGetAllCourses'),
            CoursesController.apiGetAllCourses
        );
    courseRouter
        .route('/:acronym')
        .patch(
            permissions('apiUpdateCourseByAcronym'),
            CoursesController.apiUpdateCourseByAcronym
        );
    courseRouter
        .route('/:acronym')
        .delete(
            permissions('apiDeleteCourseByAcronym'),
            CoursesController.apiDeleteCourseByAcronym
        );
} catch (e) {
    log.error(`Exception resolving Userid controller: ${e}`);
}
