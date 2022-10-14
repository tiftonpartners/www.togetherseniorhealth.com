import { Role, RolesData, User } from 'auth0';
import { ICollectionDTO } from './dto';

export interface IAuth0User extends User {
    ticket?: string;
    userNumber?: string;
}
export interface IAuth0UserCollectionDTO extends ICollectionDTO<IAuth0User> {}

export interface IAuth0Token {
    iss: string; // Issuer: the Auth0 tenant
    sub: string; // Subject: User ID
    aud: string; // Audience (intended recipient) usually https://together1api.togetherseniorlife.com
    iat: string; // when the token was issued, in *seconds* since Jan 1, 1970
    exp: string; // when the token expires, in *seconds* since Jan 1, 1970
    azp: string; // Auth0 client ID
    scope: string; // permission requested
    gty: string; // Grant type: "password" for username/password
    permissions: string[]; // List of Auth0 permissions
    app_metadata: {
        programs: string;
    };
    'https://t1.tsh.com/nickname': string; // User's nickname
    'https://t1.tsh.com/name': string; // User's name
    'https://t1.tsh.com/': string; // URL to user's picture
}

/**
 * Token issued by TSH.
 */
export interface ITshToken {
    iss: string; // Issuer: the Auth0 tenant
    sub: string; // Subject: User ID
    xid: string; // TSH Issued, external Identifier
    aud: string; // Audience (intended recipient) usually https://together1api.togetherseniorlife.com
    iat: string; // when the token was issued, in *seconds* since Jan 1, 1970
    exp: string; // when the token expires, in *seconds* since Jan 1, 1970
    azp: string; // Auth0 client ID
    gty: string; // Grant type, "pwdless" for TSH tokens
    role: string; // TSH Issued field.  Name of Auth0 role that defines permissions
    tty: string; // TSH Issued field, the ticket type (currently only user or ses)
    cls: string; // TSH Issued field, classAcronym
    permissions: string[]; // List of Auth0 permission
    'https://t1.tsh.com/nickname': string; // User's nickname
    'https://t1.tsh.com/name': string; // User's name
    'https://t1.tsh.com/': string; // URL to user's picture
}

export class IUserInfo {
    userNumber: number = -1; // Unique number assigned for this session
    userIdTemp: string | null = null; // User ID,  Only used if there is no token
    token: ITshToken | IAuth0Token | null = null; // Last JWT Token payload, decodedm ud bt
    userData: User | null = null; // User data from Auth0
    permissions: any | null = null; // Full permission information
    roles: any | null = null; // Roles from Auth0
    userDataLastSet: number = -1; // Time when the user data was last set
}

export interface IUserInfoCollectionDTO extends ICollectionDTO<IUserInfo> {}

export interface IAuth0RoleCollectionDTO extends ICollectionDTO<Role> {}
