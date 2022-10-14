import { ProcessStepType } from 'types/process';
import {
    IAVUserCollectionDTO,
    IAVUser,
    UserType,
    UserState,
    IneligibilityReason,
    WithdrawnReason
} from 'types/user';
import { SessionType } from 'types/session';
import { createAction, createAsyncAction } from 'typesafe-actions';
import { IUserInfo } from 'types/auth0';

export interface IGetAllUsersPayload {
    program: string;
    userType: UserType;
    userState?: UserState;
    course?: string;
}

export interface IGetAllUsersResponse {
    collection: IAVUserCollectionDTO;
}

export const getAllUsersAsync = createAsyncAction(
    '@@GET_ALL_USERS_REQUEST',
    '@@GET_ALL_USERS_SUCCESS',
    '@@GET_ALL_USERS_ERROR'
)<
    [IGetAllUsersPayload, undefined],
    [IGetAllUsersResponse, undefined],
    string
>();

export interface IGetUserByIdPayload {
    id: string;
}

export interface IGetUserByIdResponse {
    id: string;
    user: IUserInfo;
}

export const getUserByIdAsync = createAsyncAction(
    '@@GET_USER_BY_ID_REQUEST',
    '@@GET_USER_BY_ID_SUCCESS',
    '@@GET_USER_BY_ID_ERROR'
)<
    [IGetUserByIdPayload, undefined],
    [IGetUserByIdResponse, undefined],
    string
>();

export interface IGetUserNumberPayload {
    id: string;
}

export interface IGetUserNumberResponse {
    id: string;
    userNumber: string;
}

export const getUserNumberAsync = createAsyncAction(
    '@@GET_USER_NUMBER_REQUEST',
    '@@GET_USER_NUMBER_SUCCESS',
    '@@GET_USER_NUMBER_ERROR'
)<
    [IGetUserNumberPayload, undefined],
    [IGetUserNumberResponse, undefined],
    string
>();

export interface IGetAVUserPayload {
    userId: string;
}

export interface IGetAVUserResponse {
    user: IAVUser;
}
export const getAVUserAsync = createAsyncAction(
    '@@GET_AV_USER_REQUEST',
    '@@GET_AV_USER_SUCCESS',
    '@@GET_AV_USER_ERROR'
)<[IGetAVUserPayload, undefined], [IGetAVUserResponse, undefined], string>();

export interface IGetUserPayload {
    userId: string;
    userType: UserType;
}

export interface IGetUserResponse {
    user: IAVUser;
}
export const getUserAsync = createAsyncAction(
    '@@GET_USER_REQUEST',
    '@@GET_USER_SUCCESS',
    '@@GET_USER_ERROR'
)<[IGetUserPayload, undefined], [IGetUserResponse, undefined], string>();

export interface ICreateUserPayload {
    userType: UserType;
    user: IAVUser;
}
export const createUserAsync = createAsyncAction(
    '@@CREATE_USER_REQUEST',
    '@@CREATE_USER_SUCCESS',
    '@@CREATE_USER_ERROR'
)<[ICreateUserPayload, undefined], [ICreateUserPayload, undefined], string>();

export interface IUpdateUserPayload {
    user: Partial<IAVUser>;
    userType: UserType;
}
export const updateUserAsync = createAsyncAction(
    '@@UPDATE_USER_REQUEST',
    '@@UPDATE_USER_SUCCESS',
    '@@UPDATE_USER_ERROR'
)<[IUpdateUserPayload, undefined], [IUpdateUserPayload, undefined], string>();

export interface IDeleteUserPayload {
    userId: string;
    userType: UserType;
}
export interface IDeleteUserResponse {
    userId: string;
}

export const deleteUserAsync = createAsyncAction(
    '@@DELETE_USER_REQUEST',
    '@@DELETE_USER_SUCCESS',
    '@@DELETE_USER_ERROR'
)<[IDeleteUserPayload, undefined], [IDeleteUserResponse, undefined], string>();

export interface IMakeParticipantByIdPayload {
    userId: string;
}

export interface IMakeParticipantByIdResponse {
    userId: string;
    user: IAVUser;
}
export const makeParticipantByIdAsync = createAsyncAction(
    '@@MAKE_PARTICIPANT_BY_ID_REQUEST',
    '@@MAKE_PARTICIPANT_BY_ID_SUCCESS',
    '@@MAKE_PARTICIPANT_BY_ID_ERROR'
)<
    [IMakeParticipantByIdPayload, undefined],
    [IMakeParticipantByIdResponse, undefined],
    string
>();

export interface ICloseUserByIdPayload {
    userId: string;
    outcome: IneligibilityReason | WithdrawnReason;
}

export interface ICloseUserByIdResponse {
    userId: string;
    user: IAVUser;
}
export const closeUserByIdAsync = createAsyncAction(
    '@@CLOSE_USER_BY_ID_REQUEST',
    '@@CLOSE_USER_BY_ID_SUCCESS',
    '@@CLOSE_USER_BY_ID_ERROR'
)<
    [ICloseUserByIdPayload, undefined],
    [ICloseUserByIdResponse, undefined],
    string
>();

export interface IToggleEditUserPayload {
    userId: string;
}
export const toggleEditUser = createAction('@@TOGGLE_EDIT_USER')<
    IToggleEditUserPayload
>();

export const addUser = createAction('@@ADD_USER')();
export const cancelAddUser = createAction('@@ADD_USER_CANCEL')();

// export interface IGetUsersByProcessTypePayload {
//     processType: ProcessStepType;
//     processName: string;
//     fromDate?: string;
//     toDate?: string;
//     tz?: string;
// }

// export interface IGetUsersByProcessTypeResponse {
//     collection: IAVUserCollectionDTO;
//     processType: ProcessStepType;
//     processName: string;
// }

// export const getUsersByProcessTypeAsync = createAsyncAction(
//     '@@GET_USERS_BY_PROCESS_TYPE_REQUEST',
//     '@@GET_USERS_BY_PROCESS_TYPE_SUCCESS',
//     '@@GET_USERS_BY_PROCESS_TYPE_ERROR'
// )<
//     [IGetUsersByProcessTypePayload, undefined],
//     [IGetUsersByProcessTypeResponse, undefined],
//     string
// >();

// export interface ICompleteProcessStepPayload {
//     id: string;
//     processName: string;
//     data?: any;
//     scheduleParams?: IScheduleParams;
// }

// export interface ICompleteProcessStepResponse {
//     id: string;
//     processName: string;
//     user: Partial<IAVUser>;
// }
// export const completeProcessStepAsync = createAsyncAction(
//     '@@COMPLETE_PROCESS_STEP_REQUEST',
//     '@@COMPLETE_PROCESS_STEP_SUCCESS',
//     '@@COMPLETE_PROCESS_STEP_ERROR'
// )<
//     [ICompleteProcessStepPayload, undefined],
//     [ICompleteProcessStepResponse, undefined],
//     string
// >();

// export interface IRescheduleProcessStepPayload {
//     id: string;
//     processName: string;
//     scheduleParams: IScheduleParams;
// }

// export interface IRescheduleProcessStepResponse {
//     id: string;
//     processName: string;
//     user: Partial<IAVUser>;
// }
// export const rescheduleProcessStepAsync = createAsyncAction(
//     '@@RESCHEDULE_PROCESS_STEP_REQUEST',
//     '@@RESCHEDULE_PROCESS_STEP_SUCCESS',
//     '@@RESCHEDULE_PROCESS_STEP_ERROR'
// )<
//     [IRescheduleProcessStepPayload, undefined],
//     [IRescheduleProcessStepResponse, undefined],
//     string
// >();
