import { IAdHocSession, IAdHocSessionsCollectionDTO } from 'types/session';
import { createAsyncAction } from 'typesafe-actions';

export interface IGetAllAdHocSessionsPayload {
    program: string;
    start?: string;
    end?: string;
}

export interface IGetAllAdHocSessionsResponse {
    collection: IAdHocSessionsCollectionDTO;
    byCurrent: string[];
}

export const getAllAdHocSessionsAsync = createAsyncAction(
    '@@GET_ALL_AD_HOC_SESSIONS_REQUEST',
    '@@GET_ALL_AD_HOC_SESSIONS_SUCCESS',
    '@@GET_ALL_AD_HOC_SESSIONS_ERROR'
)<
    [IGetAllAdHocSessionsPayload, undefined],
    [IGetAllAdHocSessionsResponse, undefined],
    string
>();

export interface IGetMyAdHocSessionsPayload {
    userId: string;
    program: string;
    start?: string;
    end?: string;
}

export interface IGetMyAdHocSessionsResponse {
    collection: IAdHocSessionsCollectionDTO;
    byId: string[];
}

export const getMyAdHocSessionsAsync = createAsyncAction(
    '@@GET_MY_AD_HOC_SESSIONS_REQUEST',
    '@@GET_MY_AD_HOC_SESSIONS_SUCCESS',
    '@@GET_My_AD_HOC_SESSIONS_ERROR'
)<
    [IGetMyAdHocSessionsPayload, undefined],
    [IGetMyAdHocSessionsResponse, undefined],
    string
>();

export interface IGetAdHocSessionsByUserIdPayload {
    userId: string;
    start?: string;
    end?: string;
}

export interface IGetAdHocSessionsByUserIdResponse {
    userId: string;
    byId: string[];
    collection: IAdHocSessionsCollectionDTO;
}

export const getAdHocSessionsByUserIdAsync = createAsyncAction(
    '@@GET_AD_HOC_SESSION_BY_USER_ID_REQUEST',
    '@@GET_AD_HOC_SESSION_BY_USER_ID_SUCCESS',
    '@@GET_AD_HOC_SESSION_BY_USER_ID_ERROR'
)<
    [IGetAdHocSessionsByUserIdPayload, undefined],
    [IGetAdHocSessionsByUserIdResponse, undefined],
    string
>();

export interface IScheduleParams {
    type: string;
    instructorId: string;
    participants: string[];
    startTime: string;
    tz: string;
    duration: number | string;
    notes?: string;
    sendEmail?: boolean;
}
export interface IScheduleAdHocSessionPayload {
    userId: string;
    scheduleParams: IScheduleParams;
}

export interface IScheduleAdHocSessionResponse {
    userId: string;
    session: IAdHocSession;
}

export const scheduleAdHocSessionAsync = createAsyncAction(
    '@@SCHEDULE_AD_HOC_SESSION_REQUEST',
    '@@SCHEDULE_AD_HOC_SESSION_SUCCESS',
    '@@SCHEDULE_AD_HOC_SESSION_ERROR'
)<
    [IScheduleAdHocSessionPayload, undefined],
    [IScheduleAdHocSessionResponse, undefined],
    string
>();

export interface IRescheduleParams extends Partial<IScheduleParams> {
    acronym: string;
}

export interface IRescheduleAdHocSessionPayload {
    userId: string;
    scheduleParams: IRescheduleParams;
}

export interface IRescheduleAdHocSessionResponse {
    userId: string;
    session: IAdHocSession;
}
export const rescheduleAdHocSessionAsync = createAsyncAction(
    '@@RESCHEDULE_AD_HOC_SESSION_REQUEST',
    '@@RESCHEDULE_AD_HOC_SESSION_SUCCESS',
    '@@RESCHEDULE_AD_HOC_SESSION_ERROR'
)<
    [IRescheduleAdHocSessionPayload, undefined],
    [IRescheduleAdHocSessionResponse, undefined],
    string
>();

export interface IDeleteAdHocSessionPayload {
    sessionId: string;
    acronym: string;
}

export interface IDeleteAdHocSessionResponse {
    sessionId: string;
    deletedCount: number;
}

export const deleteAdHocSessionAsync = createAsyncAction(
    '@@DELETE_AD_HOC_SESSION_REQUEST',
    '@@DELETE_AD_HOC_SESSION_SUCCESS',
    '@@DELETE_AD_HOC_SESSION_ERROR'
)<
    [IDeleteAdHocSessionPayload, undefined],
    [IDeleteAdHocSessionResponse, undefined],
    string
>();
