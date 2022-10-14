import { Router } from 'express';
import { Logger } from '../core/logger.service';
import { ClassesController } from './class.controller';
import permissions from './permissions.middleware';
const log = Logger.logger('ClassRouter');
// @ts-ignore:
export const classRouter = new Router();
try {
    classRouter
        .route('/')
        .get(
            permissions('apiGetAllClasses'),
            ClassesController.apiGetAllClasses
        );
    classRouter
        .route('/')
        .post(permissions('apiCreateClass'), ClassesController.apiCreateClass);
    classRouter
        .route('/')
        .patch(permissions('apiUpdateClass'), ClassesController.apiUpdateClass);
    classRouter
        .route('/sessions')
        .get(
            permissions('apiGetAllSessions'),
            ClassesController.apiGetAllSessions
        );
    classRouter
        .route('/sessions')
        .post(
            permissions('apiScheduleSessions'),
            ClassesController.apiScheduleSessions
        );
    classRouter
        .route('/me')
        .get(permissions('apiGetMyClasses'), ClassesController.apiGetMyClasses);
    classRouter
        .route('/user/:userid/all')
        .get(
            permissions('apiGetAllClassesByUserId'),
            ClassesController.apiGetAllClassesByUserId
        );

    classRouter
        .route('/me/upcoming')
        .get(
            permissions('apiGetMyUpcommingClasses'),
            ClassesController.apiGetMyUpcommingClasses
        );
    classRouter
        .route('/acronym/:acronym')
        .get(
            permissions('apiGetClassByAcronym'),
            ClassesController.apiGetClassByAcronym
        );
    classRouter
        .route('/acronym/:acronym')
        .delete(
            permissions('apiDeleteClassByAcronym'),
            ClassesController.apiDeleteClassByAcronym
        );
    classRouter
        .route('/id/:classId')
        .get(permissions('apiGetClassById'), ClassesController.apiGetClassById);
    classRouter
        .route('/id/:classId')
        .delete(
            permissions('apiDeleteClassById'),
            ClassesController.apiDeleteClassById
        );
    classRouter
        .route('/id/:classId/user/add')
        .patch(
            permissions('apiAddUserToClassById'),
            ClassesController.apiAddUserToClassById
        );
    classRouter
        .route('/id/:classId/user/remove')
        .patch(
            permissions('apiRemoveUserFromClassById'),
            ClassesController.apiRemoveUserFromClassById
        );
    classRouter
        .route('/session/acronym/:acronym')
        .get(
            permissions('apiGetClassBySessionAcronym'),
            ClassesController.apiGetClassBySessionAcronym
        );
    classRouter
        .route('/session/acronym/:acronym')
        .patch(
            permissions('apiUpdateClassBySessionAcronym'),
            ClassesController.apiUpdateClassBySessionAcronym
        );
    classRouter
        .route('/session/acronym/:acronym/skip')
        .patch(
            permissions('apiSkipSessionByAcronym'),
            ClassesController.apiSkipSessionByAcronym
        );
    classRouter
        .route('/session/acronym/:acronym/delete')
        .delete(
            permissions('apiDeleteSessionByAcronym'),
            ClassesController.apiDeleteSessionByAcronym
        );
    classRouter
        .route('/session/attend')
        .post(
            permissions('apiMarkAttendance'),
            ClassesController.apiMarkAttendance
        );
    classRouter
        .route('/:courseAcronym')
        .get(
            permissions('apiGetClassesByCourseAcronym'),
            ClassesController.apiGetClassesByCourseAcronym
        );
} catch (e) {
    log.error(`Exception resolving Classes Controller: ${e}`);
}
