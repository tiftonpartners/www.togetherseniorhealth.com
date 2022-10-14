import { UserData as Auth0UserData } from 'auth0';
import { IAuth0RoleCollectionDTO, IAuth0UserCollectionDTO } from 'types/auth0';
import { createAsyncAction } from 'typesafe-actions';

export const getAllAuth0UsersAsync = createAsyncAction(
    '@@GET_ALL_AUTH0_USERS_REQUEST',
    '@@GET_ALL_AUTH0_USERS_SUCCESS',
    '@@GET_ALL_AUTH0_USERS_ERROR'
)<[undefined, undefined], [IAuth0UserCollectionDTO, undefined], string>();

export interface IUpdateAuth0UserPayload {
    userId: string;
    user: Partial<Auth0UserData>;
}
export const updateAuth0UserAsync = createAsyncAction(
    '@@UPDATE_AUTH0_USER_REQUEST',
    '@@UPDATE_AUTH0_USER_SUCCESS',
    '@@UPDATE_AUTH0_USER_ERROR'
)<
    [IUpdateAuth0UserPayload, undefined],
    [IUpdateAuth0UserPayload, undefined],
    string
>();

export interface IGetTicketForAuth0UserSuccess {
    id: string;
    ticket: string;
}
export const getTicketForAuth0UserAsync = createAsyncAction(
    '@@GET_TICKET_FOR_AUTH0_USER_REQUEST',
    '@@GET_TICKET_FOR_AUTH0_USER_SUCCESS',
    '@@GET_TICKET_FOR_AUTH0_USER_ERROR'
)<[string, undefined], [IGetTicketForAuth0UserSuccess, undefined], string>();

export interface IGetAuth0UsersByRolePayload {
    role: string;
}

export interface IGetAuth0UsersByRoleResponse {
    role: string;
    byRole: string[];
    collection: IAuth0UserCollectionDTO;
}

export const getAuth0UsersByRoleAsync = createAsyncAction(
    '@@GET_AUTH0_USERS_BY_ROLE_REQUEST',
    '@@GET_AUTH0_USERS_BY_ROLE_SUCCESS',
    '@@GET_AUTH0_USERS_BY_ROLE_ERROR'
)<
    [IGetAuth0UsersByRolePayload, undefined],
    [IGetAuth0UsersByRoleResponse, undefined],
    string
>();

export interface IGetAllAuth0RolesResponse {
    collection: IAuth0RoleCollectionDTO;
}

export const getAllAuth0RolesAsync = createAsyncAction(
    '@@GET_ALL_AUTH0_ROLES_REQUEST',
    '@@GET_ALL_AUTH0_ROLES_SUCCESS',
    '@@GET_ALL_AUTH0_ROLES_ERROR'
)<[undefined, undefined], [IGetAllAuth0RolesResponse, undefined], string>();

export interface IGetAuth0RolesByUserPayload {
    userId: string;
}

export interface IGetAuth0RolesByUserResponse {
    userId: string;
    roles: string[];
    collection: IAuth0RoleCollectionDTO;
}
export const getAuth0RolesByUserAsync = createAsyncAction(
    '@@GET_AUTH0_ROLES_BY_USER_ID_REQUEST',
    '@@GET_AUTH0_ROLES_BY_USER_ID_SUCCESS',
    '@@GET_AUTH0_ROLES_BY_USER_ID_ERROR'
)<
    [IGetAuth0RolesByUserPayload, undefined],
    [IGetAuth0RolesByUserResponse, undefined],
    string
>();

export interface IUpdateAuth0UserRolesPayload {
    userId: string;
    roles: string[];
}
export interface IUpdateAuth0UserRolesResponse {
    userId: string;
    roles: string[];
    collection: IAuth0RoleCollectionDTO;
}
export const updateAuth0UserRolesAsync = createAsyncAction(
    '@@UPDATE_AUTH0_USER_ROLES_REQUEST',
    '@@UPDATE_AUTH0_USER_ROLES_SUCCESS',
    '@@UPDATE_AUTH0_USER_ROLES_ERROR'
)<
    [IUpdateAuth0UserRolesPayload, undefined],
    [IUpdateAuth0UserRolesResponse, undefined],
    string
>();
