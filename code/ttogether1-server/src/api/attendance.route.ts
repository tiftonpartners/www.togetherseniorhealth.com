import { Router } from 'express';
import { Logger } from '../core/logger.service';
import { AttendanceController } from './attendance.controller';
import permissions from './permissions.middleware';

const log = Logger.logger('AttendanceRouter');
// @ts-ignore:
export const attendanceRouter = new Router();
try {
    attendanceRouter
        .route('/me')
        .get(
            permissions('apiGetMyAttendance'),
            AttendanceController.apiGetMyAttendance
        );
    attendanceRouter
        .route('/user/:userId')
        .get(
            permissions('apiGetUserAttendance'),
            AttendanceController.apiGetUserAttendance
        );
    attendanceRouter
        .route('/class/:classId')
        .get(
            permissions('apiGetClassAttendance'),
            AttendanceController.apiGetClassAttendance
        );
    attendanceRouter
        .route('/session/:acronym')
        .get(
            permissions('apiGetsessionAttendance'),
            AttendanceController.apiGetsessionAttendance
        );
} catch (e) {
    log.error(`Exception resolving Classes Controller: ${e}`);
}
