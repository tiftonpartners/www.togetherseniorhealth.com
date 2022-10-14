/**
 * Controller to expose information about users via a REST API
 */

import { Request, Response } from 'express';
import { UserService } from '../av/user.service';

// var jwt = require('jsonwebtoken');
import { AuthController } from './auth.controller';
import { RolesData, UserData as Auth0UserData } from 'auth0';
import {
    AVUser,
    AVUserModel,
    UserState,
    UserType,
    AgoraUserModel,
    AgoraUser,
    WithdrawnReason,
    IneligibilityReason,
} from '../db/user.db';
import { ErrorCode } from '../db/helpers';
import { Logger } from '../core/logger.service';

const log = Logger.logger('UserController');
/**
 * The user controller calls the user service and Auth0 to get information
 * about users, including the in-memory list of users which is currently used to
 * cache information about users and keep the Agora User Number assignments
 */
export class UserController extends AuthController {
    /**
     * Get information about a user given their Agora User Number
     */
    static apiGetUserByNumber = async (req: Request, res: Response) => {
        try {
            const userNumber = req.params['usernum'].toLowerCase();
            if (userNumber === 'me') {
                // Special case - return information about the authenticated user
                res.json(res.locals.userInfo);
                return;
            }
            // @ts-ignore
            if (userNumber && userNumber.length > 0 && !isNaN(userNumber)) {
                const userInfo = UserService.getUserByNumber(userNumber);
                if (userInfo) {
                    res.status(200).json({ userInfo: userInfo });
                } else {
                    res.status(404).send(
                        'ERROR No User with number ' + userNumber
                    );
                }
                return;
            }
            res.status(400).send('ERROR: Missing user number');
        } catch (e: any) {
            res.status(500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get information about a user given their Auth0 user number
     */
    static apiGetUserById = async (req: Request, res: Response) => {
        const userId = req.params['userid'];
        try {
            if (userId === 'me') {
                res.json(res.locals.userInfo);
                return;
            }
            if (userId && userId.length > 0) {
                const userInfo = await UserService.rememberUser(userId);
                if (userInfo) {
                    res.status(200).json({ userInfo: userInfo });
                }
                return;
            }
            res.status(404).send('ERROR No User with id ' + userId);
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get information about all users that have authenticated against the API. This information will include
     * details about their permissions and roles, and the user's profile information.
     * @returns An map of all known users, keyed by their Agora User Number
     */
    static apiGetAllUsers = async (req: Request, res: Response) => {
        try {
            // const profile$ =  auth0.getProfile(token)
            res.status(200).json(UserService.usersByNumber);
        } catch (e: any) {
            log.warn(`(apiGetAllUsers) Server Error: ${e}`);
            res.status(500).send('ERROR' + e.message);
        }
    };

    /**
     * Get information about EITHER a prospect or participant
     * checks permissions before sending back
     * @returns Prospect / Participant information
     */
    static apiGetAVUserById = async (
        req: Request<{ userid: string }>,
        res: Response
    ) => {
        try {
            const userId = req.params.userid;
            const perms = res.locals.perms;

            const user = await UserService.getAVUserById(userId, perms);
            res.status(200).json(user);
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get information about specific prospect
     * @returns Prospect information
     */
    static apiGetProspectById = async (
        req: Request<{ userid: string }>,
        res: Response
    ) => {
        try {
            const userId = req.params.userid;

            const user = UserService.getProspectUserById(userId);
            res.status(200).json(user);
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get information about specific participant
     * @returns Participant information
     */
    static apiGetParticipantById = async (
        req: Request<{ userid: string }>,
        res: Response
    ) => {
        try {
            const userId = req.params.userid;

            const user = UserService.getParticipantUserById(userId);
            res.status(200).json(user);
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get information about all prospects
     * @returns An map of all known prospects
     */
    static apiGetAllProspectUsers = async (
        req: Request<
            any,
            any,
            {
                program: string;
                userState?: UserState;
                course?: string;
            }
        >,
        res: Response
    ) => {
        try {
            const usersCollection = await UserService.getAllSiteUsers(
                res.locals.userInfo,
                UserType.Prospect,
                req.query.program as string,
                req.query.userState as UserState,
                req.query.course as string
            );

            res.status(200).send(usersCollection);
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get information about all participants
     * @returns An map of all known participants
     */
    static apiGetAllParticipantUsers = async (
        req: Request<
            any,
            any,
            {
                program: string;
                userState?: UserState;
                course?: string;
            }
        >,
        res: Response
    ) => {
        try {
            const usersCollection = await UserService.getAllSiteUsers(
                res.locals.userInfo,
                UserType.Participant,
                req.query.program as string,
                req.query.userState as UserState,
                req.query.course as string
            );

            res.status(200).send(usersCollection);
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get all API scopes (permissions).
     * @returns A list of objects giving the value and description for each scope
     */
    static apiGetAllScopes = async (req: Request, res: Response) => {
        try {
            // const profile$ =  auth0.getProfile(token)
            res.status(200).send(await UserService.getApiScopes());
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get information about all auth 0users that have authenticated against the API. This information will include
     * details about their permissions and roles, and the user's profile information.
     * @returns An map of all known auth0 users
     */
    static apiGetAllAuth0Users = async (req: Request, res: Response) => {
        try {
            const usersCollection = await UserService.getAuth0UsersCollection();

            res.status(200).json(usersCollection);
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Create prospect user
     *  @returns New prospect user
     */
    static apiCreateProspectUser = async (
        req: Request<any, any, { user: AVUser }>,
        res: Response
    ) => {
        try {
            const user = req.body.user;

            const avUser = await UserService.createAVUser(
                user,
                UserType.Prospect,
                res.locals.userInfo
            );
            res.status(200).json(avUser);
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Create Participant user
     *  @returns New participant user
     */
    static apiCreateParticipantUser = async (
        req: Request<any, any, { user: AVUser }>,
        res: Response
    ) => {
        try {
            const user = req.body.user;

            const avUser = await UserService.createAVUser(
                user,
                UserType.Participant,
                res.locals.userInfo
            );
            res.status(200).json(avUser);
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get information about all auth 0users that have authenticated against the API with a specific role
     * @returns An map of all known auth0 users by role
     */
    static apiGetUsersByRole = async (
        req: Request<{ role: string }>,
        res: Response
    ) => {
        try {
            const role = req.params.role;

            const users = await UserService.getAuth0UsersByRole(
                role,
                res.locals.userInfo
            );
            res.status(200).json(users);
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Update information about a user given their Auth0 user id
     */
    static apiUpdateAuth0UserById = async (
        req: Request<{ userid: string }, any, Partial<Auth0UserData>>,
        res: Response
    ) => {
        try {
            const userId = req.params.userid.toLowerCase();
            const payload = req.body;

            if (userId && userId.length > 0) {
                const userInfo = await UserService.updateUserById(
                    userId,
                    payload
                );
                if (userInfo) {
                    res.status(200).json(userInfo);
                } else {
                    res.status(404).send('ERROR No User with id ' + userId);
                }
                return;
            }
            res.status(400).send('ERROR: Missing user id');
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get all roles
     */
    static apiGetAuth0UserRoles = async (req: Request, res: Response) => {
        try {
            const roles = await UserService.getRoles();
            if (roles) {
                res.status(200).json(roles);
            } else {
                res.status(404).send('ERROR No Roles');
            }
            return;
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get all roles
     */
    static apiGetAuth0UserRolesById = async (
        req: Request<{ userid: string }>,
        res: Response
    ) => {
        try {
            const userId = req.params.userid.toLowerCase();

            if (userId && userId.length > 0) {
                const roles = await UserService.getUserRolesById(userId);
                if (roles) {
                    res.status(200).json(roles);
                } else {
                    res.status(404).send(
                        `ERROR No Roles for user id ${userId}`
                    );
                }
                return;
            }
            res.status(400).send('ERROR: Missing user id');
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Update roles for a user given their Auth0 user id
     */
    static apiUpdateAuth0UserRolesById = async (
        req: Request<{ userid: string }, any, RolesData>,
        res: Response
    ) => {
        try {
            const userId = req.params.userid.toLowerCase();
            const payload = req.body;

            if (userId && userId.length > 0) {
                const roles = await UserService.updateUserRolesById(
                    userId,
                    payload
                );
                if (roles) {
                    res.status(200).json(roles);
                } else {
                    res.status(404).send('ERROR No User with id ' + userId);
                }
                return;
            }
            res.status(400).send('ERROR: Missing user id');
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Update information about a prospect user given unique id
     * @returns User with updated info
     */
    static apiUpdateProspectUserById = async (
        req: Request<{ userid: string }, any, Partial<AVUser>>,
        res: Response
    ) => {
        try {
            const userId = req.params.userid;
            const user = req.body;

            const updatedUser = await UserService.updateAVUser(
                userId,
                user,
                UserType.Prospect,
                res.locals.userInfo
            );
            res.status(200).json(updatedUser);
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Update information about a participant user given unique id
     * @returns User with updated info
     */
    static apiUpdateParticipantUserById = async (
        req: Request<{ userid: string }, any, Partial<AVUser>>,
        res: Response
    ) => {
        try {
            const userId = req.params.userid;
            const user = req.body;

            const updatedUser = await UserService.updateAVUser(
                userId,
                user,
                UserType.Participant,
                res.locals.userInfo
            );
            res.status(200).json(updatedUser);
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Delete information about a prospect user given unique id
     * @returns boolean
     */
    static apiDeleteProspectUserByScreenerId = async (
        req: Request<{ screenerid: string }>,
        res: Response
    ) => {
        try {
            const screenerId = req.params.screenerid;
            const user = req.body;

            const deletedUser = await UserService.deleteAVUser(
                screenerId,
                UserType.Prospect,
                res.locals.userInfo
            );
            res.status(200).json(deletedUser);
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Delete information about a participant user given unique id
     * @returns boolean
     */
    static apiDeleteParticipantUserByScreenerId = async (
        req: Request<{ screenerid: string }>,
        res: Response
    ) => {
        try {
            const screenerId = req.params.screenerid;

            const deletedUser = await UserService.deleteAVUser(
                screenerId,
                UserType.Participant,
                res.locals.userInfo
            );
            res.status(200).json(deletedUser);
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Converts prospect to participant
     * @returns User with updated info
     */
    static apiMakeParticipantById = async (
        req: Request<{ userid: string }>,
        res: Response
    ) => {
        try {
            const userId = req.params.userid;

            const updatedUser = await UserService.updateAVUser(
                userId,
                {
                    __t: UserType.Participant,
                    state: UserState.NotYetAssigned,
                },
                UserType.Prospect,
                res.locals.userInfo
            );
            res.status(200).json(updatedUser);
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Closes the user
     * @returns User with updated info
     */
    static apiCloseUserById = async (
        req: Request<
            { userid: string },
            any,
            { outcome: IneligibilityReason | WithdrawnReason }
        >,
        res: Response
    ) => {
        try {
            const userId = req.params.userid;
            const outcome = req.body.outcome;

            const user = await AVUserModel.findOne({
                userId,
            });

            if (user) {
                const updatedUser = await UserService.updateAVUser(
                    userId,
                    {
                        state: UserState.Closed,
                        outcome,
                    },
                    user.__t === UserType.Participant
                        ? UserType.Participant
                        : UserType.Prospect,
                    res.locals.userInfo
                );
                res.status(200).json(updatedUser);
            } else {
                throw new ErrorCode('User not found', 404);
            }
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Returns agora user number for user id specified
     * @returns User with updated info
     */
    public static apiGetUserNumber = async (
        req: Request<{ userid: string }>,
        res: Response
    ) => {
        const userid = req.params.userid;
        try {
            const agoraUser = (await AgoraUserModel.findOne({
                userId: userid,
            })) as AgoraUser;

            // Need to add agora user for current user
            if (!agoraUser) {
                const agoraUserDb = await UserService.rememberUser(userid);

                res.status(200).json(agoraUserDb?.userNumber);
                return;
            }

            res.status(200).json(agoraUser.userNumber);
        } catch (e: any) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
        return;
    };
}
