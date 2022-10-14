import { IClass } from 'types/class';
import { IClassSession } from 'types/session';
import { IAVUser } from 'types/user';
import { createAction, createAsyncAction } from 'typesafe-actions';

export const getClassesForMeAsync = createAsyncAction(
    '@@GET_CLASSES_FOR_ME_REQUEST',
    '@@GET_CLASSES_FOR_ME_SUCCESS',
    '@@GET_CLASSES_FOR_ME_ERROR'
)<[undefined, undefined], [IClass[], undefined], string>();

export interface IGetClassesByUserIdPayload {
    userId: string;
}

export interface IGetClassesByUserIdResponse {
    userId: string;
    classes: IClass[];
}

export const getClassesByUserIdAsync = createAsyncAction(
    '@@GET_CLASSES_BY_USER_ID_REQUEST',
    '@@GET_CLASSES_BY_USER_ID_SUCCESS',
    '@@GET_CLASSES_BY_USER_ID_ERROR'
)<
    [IGetClassesByUserIdPayload, undefined],
    [IGetClassesByUserIdResponse, undefined],
    string
>();

export interface IGetClassesByCourseAcronymResponse {
    courseAcronym: string;
    classes: IClass[];
}

export const getClassesByCourseAcronymAsync = createAsyncAction(
    '@@GET_CLASSES_BY_COURSE_ACRONYM_REQUEST',
    '@@GET_CLASSES_BY_COURSE_ACRONYM_SUCCESS',
    '@@GET_CLASSES_BY_COURSE_ACRONYM_ERROR'
)<
    [string, undefined],
    [IGetClassesByCourseAcronymResponse, undefined],
    string
>();

export const getClassByIdAsync = createAsyncAction(
    '@@GET_CLASS_BY_ID_REQUEST',
    '@@GET_CLASS_BY_ID_SUCCESS',
    '@@GET_CLASS_BY_ID_ERROR'
)<[string, undefined], [IClass, undefined], string>();

export interface ICreateClassPayload {
    class: Partial<IClass>;
    courseAcronym: string;
}

export interface ICreateClassResponse {
    class: IClass;
    courseAcronym: string;
}

export const createClassAsync = createAsyncAction(
    '@@CREATE_CLASS_REQUEST',
    '@@CREATE_CLASS_SUCCESS',
    '@@CREATE_CLASS_ERROR'
)<
    [ICreateClassPayload, undefined],
    [ICreateClassResponse, undefined],
    string
>();

export interface IUpdateClassPayload {
    class: Partial<IClass>;
    courseAcronym: string;
}

export interface IUpdateClassResponse {
    class: IClass;
    courseAcronym: string;
}

export const updateClassAsync = createAsyncAction(
    '@@UPDATE_CLASS_REQUEST',
    '@@UPDATE_CLASS_SUCCESS',
    '@@UPDATE_CLASS_ERROR'
)<
    [IUpdateClassPayload, undefined],
    [IUpdateClassResponse, undefined],
    string
>();

export interface IDeleteClassByIdPayload {
    classId: string;
    courseAcronym: string;
}

export interface IDeleteClassByIdResponse {
    classId: string;
    courseAcronym: string;
}

export const deleteClassByIdAsync = createAsyncAction(
    '@@DELETE_BY_ID_CLASS_REQUEST',
    '@@DELETE_BY_ID_CLASS_SUCCESS',
    '@@DELETE_BY_ID_CLASS_ERROR'
)<
    [IDeleteClassByIdPayload, undefined],
    [IDeleteClassByIdResponse, undefined],
    string
>();

export interface IScheduleSessionsForClassPayload {
    class: Partial<IClass>;
}

export interface IScheduleSessionsForClassResponse {
    class: IClass;
}

export const scheduleSessionsForClassAsync = createAsyncAction(
    '@@SCHEDULE_SESSIONS_FOR_CLASS_REQUEST',
    '@@SCHEDULE_SESSIONS_FOR_CLASS_SUCCESS',
    '@@SCHEDULE_SESSIONS_FOR_CLASS_ERROR'
)<
    [IScheduleSessionsForClassPayload, undefined],
    [IScheduleSessionsForClassResponse, undefined],
    string
>();

export interface IUpdateSessionPayload {
    session: Partial<IClassSession>;
    classId: string;
}

export interface IUpdateSessionResponse {
    class: IClass;
}

export const updateSessionAsync = createAsyncAction(
    '@@UPDATE_SESSION_REQUEST',
    '@@UPDATE_SESSION_SUCCESS',
    '@@UPDATE_SESSION_ERROR'
)<
    [IUpdateSessionPayload, undefined],
    [IUpdateSessionResponse, undefined],
    string
>();

export interface ISkipSessionPayload {
    session: Partial<IClassSession>;
    classId: string;
}

export interface ISkipSessionResponse {
    class: IClass;
}

export const skipSessionAsync = createAsyncAction(
    '@@SKIP_SESSION_REQUEST',
    '@@SKIP_SESSION_SUCCESS',
    '@@SKIP_SESSION_ERROR'
)<
    [ISkipSessionPayload, undefined],
    [ISkipSessionResponse, undefined],
    string
>();

export interface IDeleteSessionPayload {
    sessionAcronym: string;
}

export interface IDeleteSessionResponse {
    class: IClass;
}

export const deleteSessionAsync = createAsyncAction(
    '@@DELETE_SESSION_REQUEST',
    '@@DELETE_SESSION_SUCCESS',
    '@@DELETE_SESSION_ERROR'
)<
    [IDeleteSessionPayload, undefined],
    [IDeleteSessionResponse, undefined],
    string
>();

export interface IAssignUserToClassByIdPayload {
    userId: string;
    classId: string;
    successCallback?: () => void;
    crossProgramConfirmed?: boolean;
}

export interface IAssignUserToClassByIdResponse {
    user: IAVUser;
    class: IClass;
}

export interface IAssignUserToClassByIdResponse {
    user: IAVUser;
    class: IClass;
}
export const assignUserToClassByIdAsync = createAsyncAction(
    '@@ASSIGN_USER_TO_CLASS_BY_ID_REQUEST',
    '@@ASSIGN_USER_TO_CLASS_BY_ID_SUCCESS',
    '@@ASSIGN_USER_TO_CLASS_BY_ID_ERROR'
)<
    [IAssignUserToClassByIdPayload, undefined],
    [IAssignUserToClassByIdResponse, undefined],
    string
>();

export interface IRemoveUserFromClassByIdPayload {
    userId: string;
    classId: string;
}

export interface IRemoveUserFromClassByIdResponse {
    user: IAVUser;
    class: IClass;
}
export const removeUserFromClassByIdAsync = createAsyncAction(
    '@@REMOVE_USER_FROM_CLASS_BY_ID_REQUEST',
    '@@REMOVE_USER_FROM_CLASS_BY_ID_SUCCESS',
    '@@REMOVE_USER_FROM_CLASS_BY_ID_ERROR'
)<
    [IRemoveUserFromClassByIdPayload, undefined],
    [IRemoveUserFromClassByIdResponse, undefined],
    string
>();

export const crossProgramConfirmToggle = createAction(
    '@@CROSS_PROGRAM_CONFIRM_TOGGLE'
)();
