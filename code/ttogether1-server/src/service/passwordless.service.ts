require('dotenv').config();
const jwt = require('jsonwebtoken');
const fs = require('fs');
import crypto from 'crypto';
import { ManagementClient, Permission } from 'auth0';
import base64url from 'base64url';
import { Logger } from '../core/logger.service';
import { ErrorCode } from '../db/helpers';
import {
    CustomTokenNamespace,
    Passwordless,
    PasswordlessModel,
    PasswordlessRole,
    TicketType,
} from '../db/passwordless.db';

const log = Logger.logger('PasswordlessService');

const managementClient = new ManagementClient({
    domain: process.env.AUTH0_DOMAIN as string,
    clientId: process.env.AUTH0_MGMT_API_CLIENT_ID as string,
    clientSecret: process.env.AUTH0_MGMT_API_CLIENT_SECRET as string,
    scope: 'read:users update:users read:grants read:users read:roles',
});

let privateKey: string | undefined = undefined;
try {
    privateKey = fs.readFileSync('jwtpasswordless.private.key');
} catch {
    log.debug('Cannot read Passwordless private key file, trying environment');
    privateKey = process.env.PASSWORDLESS_PVT_KEY as string;
    if (!privateKey) {
        log.warn('Passwordless key not available');
    }
}

/**
 * Provides additional functionality for Passwordless users
 */
export class PasswordlessService {
    /**
     * Get a list of all permissions that should be given to participants
     * who authenticate via the passwordless mechanism for a specific role.
     * The permisstions are defined by corresponding roles in Auth0
     *
     * @returns List of permissions, such as ["query:classAcronym", ...].  Returns [] if
     * the special role is not found.
     */
    static getPwdlessParticipantPerms = async (
        role: PasswordlessRole
    ): Promise<string[]> => {
        // Auth0 requires the Role Id to get its permissions, so looks
        // like we have to get the ID from its name...
        const roles = await managementClient.getRoles();
        for (const r of roles) {
            if (r.name === role.toString()) {
                // @ts-ignore
                const perms: Permission[] =
                    await managementClient.getPermissionsInRole({
                        id: r.id || '',
                    });
                return Promise.resolve(
                    perms.map((p: Permission) => {
                        return p.permission_name;
                    }) as string[]
                );
            }
        }
        return Promise.resolve([]);
    };

    /**
     * Generate a ramdom token for a given user, role and expiration time.
     * Information about the token is saved so it can be retrieved
     * later and a JWT token generated.
     *
     * @param userId The user who can participate
     * @param nickname Human-friendly name of the user
     * @param validMins How long is the token valid for, in minutes?  Omit for never expires
     * @param now Force the value for the current date/time, used in testing
     * @returns An random token string
     */
    public static async generateRandomUserTicket({
        userId,
        validMins,
        now,
    }: {
        userId: string;
        validMins?: number;
        now?: Date;
    }): Promise<string> {
        const rec: Passwordless = new PasswordlessModel() as Passwordless;
        const createdOn = now?.getTime() || Date.now();
        const expiresOn = new Date(
            validMins ? createdOn + validMins * 60 * 1000 : 8640000000000000
        );
        const user = await managementClient.getUser({ id: userId });

        Object.assign(rec, {
            randomTicket: base64url(crypto.randomBytes(48)),
            userId: userId,
            nickname: user.nickname,
            name: user.name,
            picture: user.picture,
            role: PasswordlessRole.User.toString(),
            validMins: validMins ? validMins : 8640000000000000 / 60 / 1000,
            createdOn: createdOn,
            expiresOn: expiresOn,
            ticketType: TicketType.User,
        });
        await rec.save();
        return Promise.resolve(rec.randomTicket);
    }

    /**
     * Generate a ramdom token for a given prospect, role and expiration time.
     * Information about the token is saved so it can be retrieved
     * later and a JWT token generated.
     *
     * @param userId The prospect who can participate
     * @param name Human-friendly name of the prospect
     * @param validMins How long is the token valid for, in minutes?  Omit for never expires
     * @param now Force the value for the current date/time, used in testing
     * @returns An random token string
     */
    public static async generateRandomAVUserTicket({
        userId,
        name,
        role,
        validMins,
        now,
    }: {
        userId: string;
        name: string;
        role?: PasswordlessRole.Prospect | PasswordlessRole.User;
        validMins?: number;
        now?: Date;
    }): Promise<string> {
        const rec: Passwordless = new PasswordlessModel() as Passwordless;
        const createdOn = now?.getTime() || Date.now();
        const expiresOn = new Date(
            validMins ? createdOn + validMins * 60 * 1000 : 8640000000000000
        );

        Object.assign(rec, {
            randomTicket: base64url(crypto.randomBytes(48)),
            userId: userId,
            name: name,
            role: role ? role.toString() : PasswordlessRole.Prospect.toString(),
            validMins: validMins ? validMins : 8640000000000000 / 60 / 1000,
            createdOn: createdOn,
            expiresOn: expiresOn,
            ticketType: TicketType.Prospect,
        });
        await rec.save();
        return Promise.resolve(rec.randomTicket);
    }

    /**
     * Generate a ramdom ticket for a specific classAcronym, role and expiration time .
     * Information about the token is saved so it can be retrieved
     * later and a JWT token generated.
     *
     * @param nickname Human-friendly name of the user
     * @param classAcronym Class acronym
     * @param validMins How long is the token valid for, in minutes?  Omit for never expires
     * @param now Force the value for the current date/time, used in testing
     * @returns An random token string
     */
    public static async generateRandomClassTicket({
        classAcronym,
        nickname,
        externalId,
        validMins,
        now,
    }: {
        classAcronym: string;
        nickname?: string;
        externalId?: string;
        validMins?: number;
        now?: Date;
    }): Promise<string> {
        const rec: Passwordless = new PasswordlessModel() as Passwordless;
        const createdOn = now?.getTime() || Date.now();
        const expiresOn = new Date(
            validMins ? createdOn + validMins * 60 * 1000 : 8640000000000000
        );
        const randomTicket = base64url(crypto.randomBytes(48));
        Object.assign(rec, {
            randomTicket: randomTicket,
            classAcronym: classAcronym,
            userId: randomTicket,
            nickname: nickname,
            externalId: externalId,
            role: PasswordlessRole.Preflight.toString(),
            validMins: validMins ? validMins : 8640000000000000 / 60 / 1000,
            createdOn: createdOn,
            expiresOn: expiresOn,
            ticketType: TicketType.Class,
        });
        await rec.save();
        return Promise.resolve(randomTicket);
    }

    /**
     * Generate a Jwt token for a previously generated and remembered random ticket.
     * Will throw an error if the random token cannot be found or is no longer valid.
     *
     * @param ticket Random ticket string
     * @param now Override current date for testing purposes
     * @returns An encoded JWT token.
     */
    public static async generateJwtToken(
        ticket: string,
        now?: Date
    ): Promise<string> {
        const rec: Passwordless = (await PasswordlessModel.findOne({
            randomTicket: ticket,
        })) as Passwordless;

        if (!rec) {
            throw new ErrorCode('Ticket not found', 404);
        }

        const when = now || new Date();
        if (rec.expiresOn.getTime() < when.getTime()) {
            throw new Error(
                'ERROR: Passwordless token expired on ' +
                    rec.expiresOn.toUTCString()
            );
        }
        // The payload is similiar to Auth0 payload with TSH issued additional fields for
        // user, class, classAcronym
        const payload = {
            iss: process.env.AUTH0_TOGETHER1_API_AUDIENCE,
            sub: rec.userId || '-',
            xid: rec.externalId || '', // TSH Issued, external Identifier
            aud: process.env.AUTH0_TOGETHER1_API_AUDIENCE,
            iat: Math.round(rec.createdOn.getTime() / 1000),
            exp: Math.round(rec.expiresOn.getTime() / 1000),
            azp: process.env.AUTH0_MGMT_API_CLIENT_ID,
            gty: 'pwdless', // Auth0 Issued field - grant type, we use our own value here
            role: rec.role, // TSH Issued field
            tty: rec.ticketType, // TSH Issued field, the ticket type (currently only user or ses)
            cls: rec.classAcronym || '-', // TSH Issued field, classAcronym
            permissions: await PasswordlessService.getPwdlessParticipantPerms(
                PasswordlessRole.User
            ), // Auth0 Issued - list of permissions from the role
        };

        log.info(payload);

        // @ts-ignore
        payload[CustomTokenNamespace + 'nickname'] = rec.nickname || '';
        // @ts-ignore
        payload[CustomTokenNamespace + 'name'] = rec.name || '';
        // @ts-ignore
        payload[CustomTokenNamespace + 'picture'] = rec.picture || '';

        const jwtToken = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
        return Promise.resolve(jwtToken);
    }

    /**
     * Generate a Jwt token for a the AWS api callback routes.
     * This may move into AWS lambda / authorizers at some point.
     *
     * @param now Override current date for testing purposes
     * @returns An encoded JWT token.
     */
    public static async generateAWSJwtToken(now?: Date): Promise<string> {
        const createdOn = now || new Date();
        const expiresOn = new Date(createdOn); // 1 day

        const payload = {
            iss: process.env.AUTH0_TOGETHER1_API_AUDIENCE,
            sub: 'AWSUSER',
            xid: 'AWSUSER',
            aud: process.env.AUTH0_TOGETHER1_API_AUDIENCE,
            iat: Math.round(createdOn.getTime() / 1000),
            exp: Math.round(expiresOn.setDate(createdOn.getDate() + 1) / 1000),
            azp: process.env.AUTH0_MGMT_API_CLIENT_ID,
            gty: 'pwdless', // Auth0 Issued field - grant type, we use our own value here
            permissions: ['update:recording'],
        };

        const jwtToken = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
        return Promise.resolve(jwtToken);
    }

    /**
     * Get access ticket for a specific prospect, given their unique member id.
     * The ticket is stored in MongoDB, and can be converted to a JWT token
     * later.
     */
    static getAVUserTicket = async (
        userId: string,
        screenName: string,
        role?: PasswordlessRole.Prospect | PasswordlessRole.User
    ) => {
        const passwordless = (await PasswordlessModel.findOne({
            userId,
        })) as Passwordless;
        let ticket;

        if (passwordless) {
            ticket = passwordless.randomTicket;
        } else {
            // No ticket has been created yet for this user

            ticket = await PasswordlessService.generateRandomAVUserTicket({
                userId,
                name: screenName,
                role,
            });
        }

        return ticket;
    };

    /**
     * Updating the screen name associated to the ticket
     */
    static updateTicketName = async (userId: string, screenName: string) => {
        const passwordless = await PasswordlessModel.findOneAndUpdate(
            {
                userId,
            },
            {
                name: screenName,
            },
            {
                new: true,
                upsert: true,
                useFindAndModify: false,
            }
        );

        if (passwordless) {
            return passwordless;
        } else {
            throw new ErrorCode(
                `No passwordless user found for user id: ${userId}`,
                404
            );
        }
    };
}
