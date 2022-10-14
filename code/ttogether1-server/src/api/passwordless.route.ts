import { Router } from 'express';
import { Logger } from '../core/logger.service';
import { PasswordlessController } from './passwordless.controller';
import permissions from './permissions.middleware';
const log = Logger.logger('PasswordlessRouter');
// @ts-ignore:
export const passwordlessRouter = new Router();
try {
    passwordlessRouter
        .route('/ticket/user/:userId')
        .put(
            permissions('apiGetUserTicket'),
            PasswordlessController.apiGetUserTicket
        );
    passwordlessRouter
        .route('/ticket/prospect/:userId')
        .put(
            permissions('apigetAVUserTicket'),
            PasswordlessController.apigetAVUserTicket
        );
    passwordlessRouter
        .route('/ticket/class/:classAcronym')
        .put(
            permissions('apiGetClassTicket'),
            PasswordlessController.apiGetClassTicket
        );
    passwordlessRouter
        .route('/token/:ticket')
        .get(PasswordlessController.apiGetToken);
    passwordlessRouter
        .route('/cert')
        .get(PasswordlessController.apiGetPublicCert);
} catch (e) {
    log.error(`Exception resolving Passwordless Controller: ${e}`);
}
