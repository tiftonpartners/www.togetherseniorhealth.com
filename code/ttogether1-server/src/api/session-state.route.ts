import { Router } from 'express';
import { Logger } from '../core/logger.service';
import permissions from './permissions.middleware';
import { SessionStateController } from './session-state.controller';
const log = Logger.logger('SessionsStateRouter');
// @ts-ignore:
export const sessionsStateRouter = new Router();
try {
    sessionsStateRouter
        .route('/all')
        .get(
            permissions('apiGetActiveSessions'),
            SessionStateController.apiGetActiveSessions
        );
    sessionsStateRouter
        .route('/timewarp/:acronym')
        .post(
            permissions('apiTimeWarpSessionTime'),
            SessionStateController.apiTimeWarpSessionTime
        );
    sessionsStateRouter
        .route('/join/:acronym')
        .post(
            permissions('apiJoinSession'),
            SessionStateController.apiJoinSession
        );
} catch (e) {
    log.error(`Exception resolving session controller: ${e}`);
}
