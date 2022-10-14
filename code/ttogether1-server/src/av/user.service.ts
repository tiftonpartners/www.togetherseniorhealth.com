/**
 * Service and types to manage cached information about users
 */

import { Logger } from '../core/logger.service';
require('dotenv').config();
import {
    ManagementClient,
    User,
    UserMetadata,
    Role,
    UpdateUserData,
    RolesData,
} from 'auth0';
import {
    AgoraUserModel,
    AgoraUser as DbUser,
    UserType,
    UserState,
    AVUser,
    AVUserModel,
    AgoraUser,
    ProspectUserModel,
    ParticipantUserModel,
    AVUserDoc,
} from '../db/user.db';
import { TshToken, Auth0Token } from '../api/token.types';
import {
    Passwordless,
    PasswordlessModel,
    PasswordlessRole,
} from '../db/passwordless.db';
import { ErrorCode } from '../db/helpers';
import { PasswordlessService } from '../service/passwordless.service';
import { AdHocSessionModel } from '../db/session.db';
import { ClassModel } from '../db/class.db';
import { ProgramService } from '../service/program.service';

const log = Logger.logger('UserService');

// Object to represent what we know about a user.
export class UserInfo {
    userNumber: number = -1; // Unique number assigned for this session
    userIdTemp: string | null = null; // User ID,  Only used if there is no token
    token: TshToken | Auth0Token | null = null; // Last JWT Token payload, decodedm ud bt
    userData: User | null = null; // User data from Auth0
    permissions: any | null = null; // Full permission information
    roles: any | null = null; // Roles from Auth0
    userDataLastSet: number = -1; // Time when the user data was last set

    // User information starts when a user first authenticates to the API
    // via a token.  The decoded token is the token payload only, without headers.
    constructor(
        jwtDecodedToken: TshToken | Auth0Token | string,
        userNumber: number
    ) {
        if (typeof jwtDecodedToken === 'string') {
            this.userIdTemp = jwtDecodedToken;
        } else {
            this.token = jwtDecodedToken;
        }
        this.userNumber = userNumber;
    }

    // Get the Auth0 permissions from the token, which is a list
    // of strings giving each permission that the user has
    get tokenGrants(): string[] | undefined {
        return (this.token || {}).permissions;
    }

    // Get programs associated and allowed for user
    get tokenPrograms(): {
        programs: string[];
        all?: boolean;
    } {
        let programs: string[] = [];
        if (
            this.token &&
            this.token.hasOwnProperty('https://t1.tsh.com/programs') &&
            this.token['https://t1.tsh.com/programs'] !== ''
        ) {
            programs = this.token['https://t1.tsh.com/programs']
                .split(',')
                .map((p) => p.trim());

            if (
                programs.includes('*') ||
                ProgramService.programsCount === programs.length
            ) {
                return {
                    programs,
                    all: true,
                };
            }

            return {
                programs,
            };
        }

        return {
            programs,
        };
    }

    get screenName(): string {
        if (
            this.userData &&
            this.userData.app_metadata &&
            this.userData.app_metadata.screen_name
        ) {
            return this.userData.app_metadata.screen_name;
        } else if (this.userData && this.userData.nickname) {
            return this.userData.nickname;
        }
        return this.token?.sub || '';
    }

    getProgramsQuery(program?: string) {
        let query: { program?: string; $or?: Object[] } = {};
        const data = this.tokenPrograms;
        const programs = data.programs;

        // Only allowed specified programs
        if (!data.all) {
            // If no programs are assigned to user
            if (programs.length === 0) {
                throw new ErrorCode(
                    'Not authorized to see program specific information',
                    403
                );
            }
            // Is there a program acronym passed through the query?
            if (program) {
                if (programs.includes(program)) {
                    query.program = program;
                } else {
                    throw new ErrorCode(
                        'Not authorized to see information specific to program provided',
                        403
                    );
                }
            } else {
                // only send back programs assigned to user
                query.$or = programs.map((p) => {
                    return { program: p };
                });
            }
            // If allowed to see all and has a program query, then narrow down by query
        } else if (program && program !== 'ALL') {
            query.program = program;
        }

        return query;
    }

    // Remember user data fetched from Auth0
    setUserData(userData: any) {
        this.userData = userData;
        this.userDataLastSet = new Date().getTime();
    }

    // Do we have valid user data?
    hasUserData(): boolean {
        return !!this.userData;
    }

    // How long has it been since user data has been refreshed, in seconds.
    userDataAgeSecs(): number {
        if (!this.hasUserData()) {
            return Number.MAX_SAFE_INTEGER;
        }
        return (new Date().getTime() - this.userDataLastSet) / 1000;
    }

    // Remember assigned user number
    assignUserNum(userNum: number) {
        this.userNumber = userNum;
    }

    isUserNumAssigned(): boolean {
        return this.userNumber > 0;
    }

    // The userId is the unique identifier supplied by Auth0.  This
    // usually comes from the token, but might come from the userIdTemp field
    // if we didn't get a token
    get userId(): string {
        return this.token?.sub || this.userIdTemp || '';
    }

    get userMetadata(): UserMetadata | null | undefined {
        return (this.userData || {}).user_metadata;
    }
}

const managementClient = new ManagementClient({
    domain: process.env.AUTH0_DOMAIN as string,
    clientId: process.env.AUTH0_MGMT_API_CLIENT_ID as string,
    clientSecret: process.env.AUTH0_MGMT_API_CLIENT_SECRET as string,
    scope: 'read:users update:users read:grants read:users read:roles',
});

// Auth0 Authentication Client

/**
 * This service remembers information about users and assigns each
 * user a unique numeric ID required by Agora.  Users can be
 * looked-up via their unique user id (from Auth0) or their
 * user number (for Agora)
 */
export class UserService {
    static usersByNumber: any = {}; // Users indexed by their user number
    static usersById: any = {}; // Users index by their user ID
    static nextId: number = 100; // The next available user ID.

    /**
     *  Lookup a user by user ID
     * @param userId - Unique userId from Auth0
     */
    static getUserById(userId: string): UserInfo | null {
        return UserService.usersById[userId];
    }

    /**
     * Lookup a user by user number
     * @param userNumber - Unique numeric user number for Agora
     */
    // Lookup a user
    static getUserByNumber(userNumber: string): UserInfo | null {
        return UserService.usersByNumber[userNumber];
    }

    /**
     * Lookup a prospect / participant user by id and
     * check for authorized permissions
     * @param userId - Unique user id
     * @param perms - List of permissions for the authenticated user
     * @param authEnabled - Should authorization run
     */
    static async getAVUserById(
        userId: string,
        perms?: string[],
        authEnabled: boolean = process.env.PERMISSIONS_AUTH_ENABLED === 'true'
    ): Promise<AVUserDoc> {
        const user = await AVUserModel.findOne({
            userId,
        });

        if (user) {
            const userType = user.get('__t');

            // make sure perms are passed from middleware
            // and that the user type from the retrieved user
            // matches permissions from the calling user
            if (authEnabled) {
                if (
                    !perms ||
                    perms.length === 0 ||
                    !userType ||
                    !perms.includes(
                        `get:${
                            userType === UserType.Participant
                                ? 'participant'
                                : 'prospect'
                        }`
                    )
                ) {
                    throw new ErrorCode(
                        `Forbidden: User does not have correct permissions to retrieve this user.`,
                        403
                    );
                }
            }

            return user;
        } else {
            throw new ErrorCode('No User with user id ' + userId, 404);
        }
    }

    /**
     * Lookup a prospect user by id and
     * check for authorized permissions
     * @param userId - Unique user id
     */
    static async getProspectUserById(userId: string): Promise<AVUserDoc> {
        if (userId) {
            const user = await AVUserModel.findOne({
                __t: UserType.Prospect,
                userId,
            });

            if (user) {
                return user;
            } else {
                throw new ErrorCode('No User with user id ' + userId, 404);
            }
        } else {
            throw new ErrorCode('User ID is required', 400);
        }
    }

    /**
     * Lookup a participant user by id and
     * check for authorized permissions
     * @param userId - Unique user id
     */
    static async getParticipantUserById(userId: string): Promise<AVUserDoc> {
        if (userId) {
            const user = await AVUserModel.findOne({
                __t: UserType.Participant,
                userId,
            });

            if (user) {
                return user;
            } else {
                throw new ErrorCode('No User with user id ' + userId, 404);
            }
        } else {
            throw new ErrorCode('User ID is required', 400);
        }
    }

    /**
     * Create av user (prospect / participant)
     * @param user New user to create
     * @param userType Prospect / Participant
     */
    static async createAVUser(
        user: Omit<AVUser, 'state' | 'outcome' | 'userId'>,
        userType: UserType,
        userInfo: UserInfo
    ): Promise<AVUserDoc> {
        const { programs, all } = userInfo.tokenPrograms;

        const existingUser = await AVUserModel.findOne({
            sid: user.sid,
        });

        // User with SID already exists
        if (existingUser) {
            throw new ErrorCode(
                `User with screener ID '${user.sid}' already exists`,
                400
            );
        }

        if (user.pidn) {
            const existingUser = await AVUserModel.findOne({
                pidn: user.pidn,
            });

            // User with PIDN already exists
            if (existingUser) {
                throw new ErrorCode(
                    `User with participant ID '${user.pidn}' already exists`,
                    400
                );
            }
        }

        if (!user.screenName) {
            throw new ErrorCode(`Screen name is not valid`, 400);
        }

        if (!all && !programs.includes(user.program)) {
            throw new ErrorCode(
                'User does not have permissions to create user with this program.',
                403
            );
        }

        const createdUser =
            userType === UserType.Prospect
                ? await ProspectUserModel.create({
                      ...(user as AVUser),
                  })
                : await ParticipantUserModel.create({
                      ...(user as AVUser),
                  });

        if (createdUser) {
            const userId = `TSH-Admin|${createdUser._id}`;
            const ticket = await PasswordlessService.getAVUserTicket(
                userId,
                user.screenName,
                UserType.Prospect
                    ? PasswordlessRole.Prospect
                    : PasswordlessRole.User
            );

            createdUser.userId = userId;
            createdUser.ticket = ticket;
            await createdUser.save();

            // Saves user to agora db
            await UserService.rememberUser(userId);

            return createdUser;
        } else {
            throw new ErrorCode('Creating new user', 400);
        }
    }

    /**
     * Create hubspot user (prospect / participant)
     * @param user New user to create
     * @param userType Prospect / Participant
     * @param userInfo
     */
    static async createOrUpdateHubspotUser(
        user: Omit<AVUser, 'state' | 'outcome' | 'userId'>,
        userType: UserType,
        userInfo: UserInfo
    ): Promise<AVUserDoc> {
        // pre-checks
        if (!user.screenName) {
            throw new ErrorCode(`Screen name is not valid`, 400);
        }
        if (!user.email) {
            throw new ErrorCode(`Email is not valid`, 400);
        }
        if (!user.sid) {
            throw new ErrorCode(`ScreenerId is not valid`, 400);
        }

        // if we have the user with the same email
        // we update its screener id as per https://togetherseniorhealth.atlassian.net/browse/TOG-1457
        //
        let existing_user = await AVUserModel.findOne({ email: user.email });
        if (existing_user) {
            existing_user.sid = user.sid;
            return existing_user.save();
        }

        // check unique sid
        if (user.sid) {
            const existingUser = await AVUserModel.findOne({
                sid: user.sid,
            });
            if (existingUser) {
                throw new ErrorCode(
                    `User with screener ID '${user.sid}' already exists`,
                    400
                );
            }
        }

        // check prospect id
        if (user.pidn) {
            const existingUser = await AVUserModel.findOne({
                pidn: user.pidn,
            });
            if (existingUser) {
                throw new ErrorCode(
                    `User with participant ID '${user.pidn}' already exists`,
                    400
                );
            }
        }

        // create new
        //
        const createdUser =
            userType === UserType.Prospect
                ? await ProspectUserModel.create({
                      ...(user as AVUser),
                  })
                : await ParticipantUserModel.create({
                      ...(user as AVUser),
                  });

        if (createdUser) {
            const userId = `TSH-Admin|${createdUser._id}`;
            const ticket = await PasswordlessService.getAVUserTicket(
                userId,
                user.screenName,
                UserType.Prospect
                    ? PasswordlessRole.Prospect
                    : PasswordlessRole.User
            );

            createdUser.userId = userId;
            createdUser.ticket = ticket;
            await createdUser.save();

            // Saves user to agora db
            await UserService.rememberUser(userId);

            return createdUser;
        } else {
            throw new ErrorCode('Creating new user', 400);
        }
    }

    /**
     * Update av user (prospect / participant)
     * @param userId
     * @param user New user to create
     * @param userType Prospect / Participant
     * @param authUserInfo
     */
    static async updateAVUser(
        userId: string,
        user: Partial<AVUser & { _id?: string }>,
        userType: UserType,
        authUserInfo: UserInfo
    ): Promise<AVUserDoc> {
        const { programs, all } = authUserInfo.tokenPrograms;

        const existingUser = await AVUserModel.findOne({
            _id: {
                $ne: user._id,
            },
            sid: user.sid,
        });

        // User with SID already exists
        if (existingUser) {
            throw new ErrorCode(
                `User with screener ID '${user.sid}' already exists`,
                400
            );
        }

        if (user.pidn) {
            const existingUser = await AVUserModel.findOne({
                _id: {
                    $ne: user._id,
                },
                pidn: user.pidn,
            });

            // User with PIDN already exists
            if (existingUser) {
                throw new ErrorCode(
                    `User with participant ID '${user.pidn}' already exists`,
                    400
                );
            }
        }

        const userInfo = await AVUserModel.findOne({
            __t: userType,
            userId,
        });

        if (userInfo) {
            if (!all && !programs.includes(userInfo.program)) {
                throw new ErrorCode(
                    'User does not have program permissions to update user.',
                    403
                );
            }

            if (
                userInfo.sid.startsWith('h-') &&
                user.sid !== undefined &&
                user.sid !== userInfo.sid
            ) {
                throw new ErrorCode(
                    'Can not change screenerId of HubSpot operated user',
                    400
                );
            }

            const screenName =
                user.hasOwnProperty('screenName') && user.screenName
                    ? user.screenName
                    : '';

            if (screenName !== '') {
                await PasswordlessService.updateTicketName(userId, screenName);
            }

            const updatedUser = await AVUserModel.findOneAndUpdate(
                { userId },
                user,
                {
                    new: true,
                    upsert: true,
                    useFindAndModify: false,
                }
            );

            // If user was put on hold
            if (updatedUser.state === UserState.Closed) {
                await AdHocSessionModel.deleteMany({ participants: userId });
                const classesWithParticipant = await ClassModel.find({
                    participants: userId,
                });

                if (classesWithParticipant) {
                    for (let i = 0; i < classesWithParticipant.length; i++) {
                        classesWithParticipant[i].participants =
                            classesWithParticipant[i].participants.filter(
                                (p) => p !== userId
                            );
                        await classesWithParticipant[i].save();
                    }
                }
            }

            return updatedUser;
        } else {
            throw new ErrorCode('No User with user id ' + userId, 404);
        }
    }

    /**
     * Delete av user (prospect / participant)
     * @param userId User id to delete
     * @param userType Prospect / Participant
     */
    static async deleteAVUser(
        sid: string,
        userType: UserType,
        authUserInfo: UserInfo
    ): Promise<boolean> {
        const { programs, all } = authUserInfo.tokenPrograms;

        const userInfo = await AVUserModel.findOne({
            __t: userType,
            sid,
        });

        if (userInfo) {
            if (!all && !programs.includes(userInfo.program)) {
                throw new ErrorCode(
                    'User does not have program permissions to update user.',
                    403
                );
            }
            const { deletedCount } = await AVUserModel.deleteOne({
                sid,
            });

            // Delete was not successful
            if (!deletedCount || deletedCount <= 0) {
                throw new ErrorCode(
                    `User with screener ID '${sid}' could not be deleted`,
                    400
                );
            }

            await AdHocSessionModel.deleteMany({
                participants: userInfo.userId,
            });
            const classesWithParticipant = await ClassModel.find({
                participants: userInfo.userId,
            });

            if (classesWithParticipant) {
                for (let i = 0; i < classesWithParticipant.length; i++) {
                    classesWithParticipant[i].participants =
                        classesWithParticipant[i].participants.filter(
                            (p) => p !== userInfo.userId
                        );
                    await classesWithParticipant[i].save();
                }
            }
        } else {
            throw new ErrorCode('No User with screener id ' + sid, 404);
        }

        return true;
    }

    /**
     * Update a user by user number
     * @param userId - User id given by auth0
     * @param userData - Partial user data to update
     */
    static updateUserById = async (
        userId: string,
        userData: UpdateUserData
    ): Promise<User | null> => {
        const updatedUser = managementClient.updateUser(
            { id: userId },
            userData
        );
        return updatedUser;
    };

    /**
     * Get a user's roles by user number
     * @param userId - User id given by auth0
     */
    static getUserRolesById = async (userId: string): Promise<Role[]> => {
        return await managementClient.getUserRoles({ id: userId });
    };

    /**
     * Update a user's roles by user number
     * @param userId - User id given by auth0
     * @param roles - Roles to be assigned to user
     */
    static updateUserRolesById = async (
        userId: string,
        rolesData: RolesData
    ): Promise<Role[]> => {
        let rolesToRemove: string[] = [];
        const roles: Role[] = await managementClient.getUserRoles({
            id: userId,
        });

        roles.map((roleAssigned) => {
            if (roleAssigned.id) {
                // if the roles sent include a role already assigned
                // to the user, then we do not need to do anything
                // so we remove from the sent roles
                if (rolesData.roles.includes(roleAssigned.id)) {
                    let index = rolesData.roles.indexOf(roleAssigned.id);
                    rolesData.roles.splice(index, 1);
                } else {
                    // if the roles sent do not include a role already assigned
                    // to the user, then we need to remove
                    rolesToRemove.push(roleAssigned.id);
                }
            }
        });

        // at this point any roles in the rolesData object are ones
        // that need to be added
        if (rolesData.roles.length > 0) {
            await managementClient.assignRolestoUser({ id: userId }, rolesData);
        }

        if (rolesToRemove.length > 0) {
            await managementClient.removeRolesFromUser(
                { id: userId },
                { roles: rolesToRemove }
            );
        }

        return await managementClient.getUserRoles({ id: userId });
    };

    /**
     * Remember a user, given their authentication token or userId
     * If this is the first time we've seen the user, then we
     * assign them a unique number (for Agora) and fetch
     * additional information about the user.
     * @param jwtDecodedToken Decoded JWT Token OR the user's ID
     */
    static rememberUser = async (
        jwtDecodedToken: Auth0Token | TshToken | string
    ): Promise<UserInfo | undefined> => {
        if (!jwtDecodedToken) return;
        const userId =
            typeof jwtDecodedToken === 'string'
                ? jwtDecodedToken
                : jwtDecodedToken.sub;

        // First, look in the cache
        let userInfo = UserService.getUserById(userId);
        if (userInfo) {
            // In the cache, then it is also in the
            // database and nothing else to do.
            if (typeof jwtDecodedToken != 'string') {
                // Aways update the token from the one in the request
                // @ts-ignore
                userInfo.token = jwtDecodedToken;
            }
            return userInfo;
        }

        // Not in the cache, how about the Mongo Database?
        let usr: DbUser = (await AgoraUserModel.findOne({
            userId: userId,
        })) as DbUser;
        if (!usr) {
            // Not in the database, save the user, which will
            // also assign a user number
            usr = new AgoraUserModel() as DbUser;
            usr.userId = userId;

            await UserService.setNextUserNumber(usr);
            await usr.save();
        }
        // Build the Higher lever record with usernumber, token
        // and add it to the cache
        userInfo = new UserInfo(jwtDecodedToken, usr.userNumber);
        UserService.usersById[userId] = userInfo;
        UserService.usersByNumber[userInfo.userNumber] = userInfo;

        return UserService.fetchAuth0Info(userInfo);
    };

    /**
     * Fetch/refresh user and user metadata from Auth0
     * @param userInfo UserInfo data we currently have for the user
     * @returns An array including the Auth0 user profile ('user'), permissions ('perms'), and roles ('roles')
     */
    static fetchAuth0Info = async (userInfo: UserInfo): Promise<UserInfo> => {
        // Not getting profile for now (this seems to run slow)
        // const profile$ =  auth0.getProfile(token)
        // await managementClient.updateUserMetadata({ id: profile.sub }, { agora_id: agora_id })
        // @ts-ignore
        const uid = userInfo.userId.toLowerCase();
        if (
            uid.startsWith('auth0') ||
            uid.startsWith('google') ||
            uid.startsWith('email')
        ) {
            // Must be an Auth0 user.  Get info.
            const user$ = managementClient.getUser({ id: userInfo.userId });
            const [user] = await Promise.all([user$]);
            userInfo.setUserData(user);
        } else {
            // Do we have a passwordless ticket for them?
            const passwordless: Passwordless = (await PasswordlessModel.findOne(
                {
                    userId: userInfo.userId,
                }
            )) as Passwordless;

            if (passwordless) {
                // Its a passwordless user.
                const usr = {
                    name: passwordless.name,
                    user_id: userInfo.userId,
                    nickname: passwordless.name,
                    username: passwordless.name,
                };
                userInfo.setUserData(usr);
            }
        }

        // Note - it would be faster to use conventions on the user id, but
        // not sure of all conventions for Auth0?
        // @ts-ignore
        return userInfo;
    };

    /**
     * Get list of all users in Auth0.
     */
    static getAuth0Users = async (): Promise<User[] | undefined> => {
        const result = [];
        const params = {
            per_page: 10,
            page: 0,
        };
        let count = params.per_page;
        while (count > 0) {
            const users = await managementClient.getUsers(params);
            count = users.length;
            for (const user of users) {
                //@ts-ignore
                result.push(user);
            }
            params.page++;
        }
        return result;
    };

    /**
     * Get list of all users in Auth0 as collection
     */
    static getAuth0UsersCollection = async (): Promise<{
        [key: string]: User;
    }> => {
        const users = await UserService.getAuth0Users();

        if (!users) {
            throw new ErrorCode('No auth0 users found', 404);
        }

        const userNumbers$ = users.map(async (user: User) => {
            if (user.user_id) {
                const agoraUser = (await AgoraUserModel.findOne({
                    userId: user.user_id,
                })) as AgoraUser;

                // Need to add agora user for current user
                if (!agoraUser) {
                    const agoraUserDb = await UserService.rememberUser(
                        user.user_id
                    );
                    return {
                        ...user,
                        userNumber: agoraUserDb?.userNumber,
                    };
                }

                return { ...user, userNumber: agoraUser.userNumber };
            }
        });

        const final = await Promise.all(userNumbers$);

        const usersCollection = Object.assign(
            {},
            ...final.map((user) => ({ [user?.user_id as string]: user }))
        );

        return usersCollection;
    };

    /**
     * Get users by role in Auth0
     */
    static getAuth0UsersByRole = async (
        roleName: string,
        userInfo: UserInfo
    ): Promise<User[] | undefined> => {
        const roles = await managementClient.getRoles();
        const role = roles.find((role) => role.name === roleName);

        if (role && role.id) {
            const users = await managementClient.getUsersInRole({
                id: role.id as string,
            });
            const usersEnriched$ = users.map(async (user) => {
                return await managementClient.getUser({
                    id: user.user_id as string,
                });
            });

            const usersEnriched = await Promise.all(usersEnriched$);

            const { programs, all } = userInfo.tokenPrograms;

            if (usersEnriched) {
                const usersFiltered = usersEnriched.filter((user) => {
                    // if user requesting has all programs
                    if (all) {
                        return true;
                    }

                    if (user.app_metadata && user.app_metadata.programs) {
                        const userPrograms = user.app_metadata.programs.split(
                            ','
                        ) as string[];

                        for (const userProgram of userPrograms) {
                            // include any users that have all programs

                            if (
                                programs.includes(userProgram) ||
                                userProgram === '*'
                            ) {
                                return true;
                            }
                        }
                    }

                    return false;
                });
                if (usersFiltered) {
                    return usersFiltered;
                } else {
                    throw new ErrorCode(
                        `No users found with role: ${role}`,
                        404
                    );
                }
            } else {
                throw new ErrorCode(`No users found with role: ${role}`, 404);
            }
        }

        return;
    };

    /**
     * Get user by id in Auth0
     */
    static getAuth0UsersByIds = async (ids: string[]): Promise<User[]> => {
        const query = ids.map((id) => `user_id:"${id}"`);
        return managementClient.getUsers({ q: query.join(' OR ') });
    };

    /**
     * Get list of all roles in Auth0.
     * Note that the Auth0 API supports pagination, which we should
     * take advantage of at some point...
     */
    static getRoles = async (): Promise<Role[]> => {
        return managementClient.getRoles();
    };

    /**
     * Get a list of the  scopes
     */
    static getApiScopes = async (): Promise<
        { description: string; value: string }[] | undefined
    > => {
        const apis = (await managementClient.getResourceServers()).filter(
            (api) => {
                return (
                    api.identifier === process.env.AUTH0_TOGETHER1_API_AUDIENCE
                );
            }
        );
        return apis[0].scopes;
    };

    static setNextUserNumber = async (user: DbUser): Promise<UserInfo> => {
        return new Promise((resolve, reject) => {
            (user as any).setNext('userNumber', (err: string, userObj: any) => {
                if (err) {
                    log.warn(`(setNextUserNumber) failed: ${err}`);
                    reject(err);
                }
                resolve(userObj);
                return;
            });
        });
    };

    /**
     * Get all site users
     * @param userInfo Info object from user data
     * @param program Information to update program
     */
    static async getAllSiteUsers(
        userInfo: UserInfo,
        userType: UserType,
        program?: string,
        userState?: UserState,
        course?: string
    ): Promise<{ [key: string]: AVUser }> {
        try {
            let query: any = {};

            if (userType) query.__t = userType as UserType;
            if (userState) query.state = userState as UserState;
            if (course) query.courseInterest = course as string;

            if (userInfo) {
                query = {
                    ...query,
                    ...userInfo.getProgramsQuery(program),
                };

                const users = await AVUserModel.find(query).limit(500);

                const usersCollecion = Object.assign(
                    {},
                    ...users.map((user) => ({
                        [user.id.toString() as string]: user,
                    }))
                );

                return usersCollecion;
            } else {
                throw new ErrorCode('No user info found', 404);
            }
        } catch (e) {
            throw e;
        }
    }
}
