import { Router } from 'express';
import { Logger } from '../core/logger.service';
import { AdhocSessionController } from './adhoc-session.controller';
import permissions from './permissions.middleware';

const log = Logger.logger('AdhocSessionRouter');

// @ts-ignore:
export const adhocSessionRouter = new Router();
try {
    adhocSessionRouter
        .route('/')
        .get(
            permissions('apiGetAllAdHocSessions'),
            AdhocSessionController.apiGetAllAdHocSessions
        );
    adhocSessionRouter
        .route('/schedule')
        .get(
            permissions('apiGetSchedule'),
            AdhocSessionController.apiGetSchedule
        );
    adhocSessionRouter
        .route('/upcoming/me')
        .get(
            permissions('apiGetMyUpcoming'),
            AdhocSessionController.apiGetMyUpcoming
        );
    adhocSessionRouter
        .route('/upcoming/:userId')
        .get(
            permissions('apiGetUpcoming'),
            AdhocSessionController.apiGetUpcoming
        );
    adhocSessionRouter
        .route('/:acronym')
        .get(
            permissions('apiGetSession'),
            AdhocSessionController.apiGetSession
        );
    adhocSessionRouter
        .route('/:acronym')
        .delete(
            permissions('apiDeleteSession'),
            AdhocSessionController.apiDeleteSession
        );
    adhocSessionRouter
        .route('/')
        .post(
            permissions('apiScheduleSession'),
            AdhocSessionController.apiScheduleSession
        );
    adhocSessionRouter
        .route('/reschedule')
        .post(
            permissions('apiRescheduleSession'),
            AdhocSessionController.apiRescheduleSession
        );
} catch (e) {
    log.error(`Exception resolving adhoc session controller: ${e}`);
}
