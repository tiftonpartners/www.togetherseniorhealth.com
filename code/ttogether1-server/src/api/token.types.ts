/**
 * Token issued by Auth0
 */
export interface Auth0Token {
    iss: string; // Issuer: the Auth0 tenant
    sub: string; // Subject: User ID
    aud: string | string[]; // Audience (intended recipient) usually https://together1api.togetherseniorlife.com
    iat: string; // when the token was issued, in *seconds* since Jan 1, 1970
    exp: string; // when the token expires, in *seconds* since Jan 1, 1970
    azp: string; // Auth0 client ID
    scope: string; // permission requested
    gty: string; // Grant type: "password" for username/password
    permissions: string[]; // List of Auth0 permissions
    'https://t1.tsh.com/programs': string; // List of programs user has permissions to access
    'https://t1.tsh.com/nickname': string; // User's nickname
    'https://t1.tsh.com/name': string; // User's name
    'https://t1.tsh.com/': string; // URL to user's picture
}

/**
 * Token issued by TSH.
 */
export interface TshToken {
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
    'https://t1.tsh.com/programs': string; // List of programs user has permissions to access
    'https://t1.tsh.com/nickname': string; // User's nickname
    'https://t1.tsh.com/name': string; // User's name
    'https://t1.tsh.com/': string; // URL to user's picture
}
