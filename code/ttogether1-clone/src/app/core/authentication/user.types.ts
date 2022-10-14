import { Auth0Permission } from '@app/core/authentication/credentials.service';

export interface UserInfoI {
  userNumber: number;
  token: Auth0Token;
  userData: Auth0UserData;
  permissions: Auth0PermissionDetail[];
  roles: Auth0Role[];
  userDataLastSet: number;
}

export class UserInfo implements UserInfoI {
  id: string;
  userNumber = 0;
  token: Auth0Token | null = null;
  userData: Auth0UserData | null = null;
  permissions: Auth0PermissionDetail[] = [];
  name: string;
  nickname: string;
  picture: string;
  roles: Auth0Role[] = [];
  userDataLastSet = -1;

  constructor(obj: any = {}) {
    Object.assign(this, obj);
  }

  hasPermission(perm: Auth0Permission): boolean {
    try {
      return this.token.permissions.includes(perm.toString());
    } catch {}

    return false;
  }

  hasAnyPermission(perms: Auth0Permission[]): boolean {
    for (const p of perms) {
      if (this.hasPermission(p)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Verify if current user has permissions as an Instructor
   *
   * @returns boolean
   */
  get isAnInstructor(): boolean {
    return this.hasPermission(Auth0Permission.ignore_globalcmds);
  }
}

export interface Auth0PermissionDetail {
  permission_name: string;
  description: string;
  resource_server_name: ResourceServerName;
  resource_server_identifier: string;
  sources: Auth0Source[];
}

export enum ResourceServerName {
  Together1API = 'Together1API'
}

export interface Auth0Source {
  source_id: string;
  source_name: string;
  source_type: Auth0SourceType;
}

export enum Auth0SourceType {
  Direct = 'DIRECT',
  Auth0Role = 'ROLE'
}

export interface Auth0Role {
  id: string;
  name: string;
  description: string;
  sources: Auth0Source[];
}

export interface Auth0Token {
  iss: string;
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  azp: string;
  gty: string;
  role: string;
  tty: string;
  cls: string;
  scope: string;
  permissions: string[];

  'https://t1.tsh.com/nickname': string;
  'https://t1.tsh.com/name': string;
  'https://t1.tsh.com/picture': string;
}

export interface Auth0UserData {
  created_at: Date;
  email: string;
  email_verified: boolean;
  identities: Auth0Identity[];
  name: string;
  nickname: string;
  picture: string;
  updated_at: Date;
  user_id: string;
  username: string;
  last_ip: string;
  last_login: Date;
  logins_count: number;
}

export interface Auth0Identity {
  user_id: string;
  provider: string;
  connection: string;
  isSocial: boolean;
}
