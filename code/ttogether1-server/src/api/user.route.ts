import { Router } from 'express';
import { Logger } from '../core/logger.service';
import permissions from './permissions.middleware';
import { UserController } from './user.controller';
const log = Logger.logger('UserRouter');
// @ts-ignore:
export const userRouter = new Router();

try {
    userRouter
        .route('/')
        .get(permissions('apiGetAllUsers'), UserController.apiGetAllUsers);

    userRouter
        .route('/prospect')
        .post(
            permissions('apiCreateProspectUser'),
            UserController.apiCreateProspectUser
        );
    userRouter
        .route('/participant')
        .post(
            permissions('apiCreateParticipantUser'),
            UserController.apiCreateParticipantUser
        );
    userRouter
        .route('/prospect/all')
        .get(
            permissions('apiGetAllProspectUsers'),
            UserController.apiGetAllProspectUsers
        );
    userRouter
        .route('/participant/all')
        .get(
            permissions('apiGetAllParticipantUsers'),
            UserController.apiGetAllParticipantUsers
        );
    userRouter
        .route('/role/:role')
        .get(
            permissions('apiGetUsersByRole'),
            UserController.apiGetUsersByRole
        );
    userRouter
        .route('/number/:usernum')
        .get(
            permissions('apiGetUserByNumber'),
            UserController.apiGetUserByNumber
        ); // Deprecated - replaced by special user number 'me'
    userRouter
        .route('/id/:userid')
        .get(permissions('apiGetUserById'), UserController.apiGetUserById);
    userRouter
        .route('/avuser/:userid')
        .get(permissions('apiGetAVUserById'), UserController.apiGetAVUserById);
    userRouter
        .route('/prospect/:userid')
        .get(
            permissions('apiGetProspectById'),
            UserController.apiGetProspectById
        );
    userRouter
        .route('/participant/:userid')
        .get(
            permissions('apiGetParticipantById'),
            UserController.apiGetParticipantById
        );
    userRouter
        .route('/prospect/:userid')
        .patch(
            permissions('apiUpdateProspectUserById'),
            UserController.apiUpdateProspectUserById
        );
    userRouter
        .route('/participant/:userid')
        .patch(
            permissions('apiUpdateParticipantUserById'),
            UserController.apiUpdateParticipantUserById
        );
    userRouter
        .route('/prospect/:screenerid')
        .delete(
            permissions('apiDeleteProspectUserByScreenerId'),
            UserController.apiDeleteProspectUserByScreenerId
        );
    userRouter
        .route('/participant/:screenerid')
        .delete(
            permissions('apiDeleteParticipantUserByScreenerId'),
            UserController.apiDeleteParticipantUserByScreenerId
        );
    userRouter
        .route('/id/:userid/makeParticipant')
        .patch(
            permissions('apiMakeParticipantById'),
            UserController.apiMakeParticipantById
        );
    userRouter
        .route('/id/:userid/close')
        .patch(
            permissions('apiCloseUserById'),
            UserController.apiCloseUserById
        );
    userRouter
        .route('/id/:userid/userNumber')
        .get(permissions('apiGetUserNumber'), UserController.apiGetUserNumber);
    userRouter
        .route('/scopes')
        .get(permissions('apiGetAllScopes'), UserController.apiGetAllScopes);
    userRouter
        .route('/auth0')
        .get(
            permissions('apiGetAllAuth0Users'),
            UserController.apiGetAllAuth0Users
        );
    userRouter
        .route('/auth0/:userid')
        .patch(
            permissions('apiUpdateAuth0UserById'),
            UserController.apiUpdateAuth0UserById
        );
    userRouter
        .route('/auth0/roles')
        .get(
            permissions('apiGetAuth0UserRoles'),
            UserController.apiGetAuth0UserRoles
        );
    userRouter
        .route('/auth0/roles/:userid')
        .get(
            permissions('apiGetAuth0UserRolesById'),
            UserController.apiGetAuth0UserRolesById
        );
    userRouter
        .route('/auth0/roles/:userid')
        .patch(
            permissions('apiUpdateAuth0UserRolesById'),
            UserController.apiUpdateAuth0UserRolesById
        );
    userRouter
        .route('/:usernum')
        .get(
            permissions('apiGetUserByNumber'),
            UserController.apiGetUserByNumber
        );
} catch (e) {
    log.error(`Exception resolving Userid controller: ${e}`);
}
