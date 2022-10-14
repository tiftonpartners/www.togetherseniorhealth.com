import { IEmailLedgerCollectionDTO } from 'types/notification';
import { createAsyncAction } from 'typesafe-actions';

export interface ISendClassReminderEmailByUserIdPayload {
    classAcronym: string;
    userId: string;
}

export interface ISendClassReminderEmailByUserIdResponse {
    classAcronym: string;
    userId: string;
    emailSent: boolean;
}

export const sendClassReminderEmailByUserIdAsync = createAsyncAction(
    '@@SEND_CLASS_REMINDER_EMAIL_BY_USER_ID_REQUEST',
    '@@SEND_CLASS_REMINDER_EMAIL_BY_USER_ID_SUCCESS',
    '@@SEND_CLASS_REMINDER_EMAIL_BY_USER_ID_ERROR'
)<
    [ISendClassReminderEmailByUserIdPayload, undefined],
    [ISendClassReminderEmailByUserIdResponse, undefined],
    string
>();

export interface ISendAdHocSessionReminderEmailByUserIdPayload {
    sessionAcronym: string;
    userId: string;
}

export interface ISendAdHocSessionReminderEmailByUserIdResponse {
    sessionAcronym: string;
    userId: string;
    emailSent: boolean;
}

export const sendAdHocSessionReminderEmailByUserIdAsync = createAsyncAction(
    '@@SEND_AD_HOC_SESSION_REMINDER_EMAIL_BY_USER_ID_REQUEST',
    '@@SEND_AD_HOC_SESSION_REMINDER_EMAIL_BY_USER_ID_SUCCESS',
    '@@SEND_AD_HOC_SESSION_REMINDER_EMAIL_BY_USER_ID_ERROR'
)<
    [ISendAdHocSessionReminderEmailByUserIdPayload, undefined],
    [ISendAdHocSessionReminderEmailByUserIdResponse, undefined],
    string
>();

export interface IGetAllLedgerEntriesPayload {}

export interface IGetAllLedgerEntriesResponse {
    collection: IEmailLedgerCollectionDTO;
    byDate: string[];
}

export const getAllLedgerEntriesAsync = createAsyncAction(
    '@@GET_ALL_LEDGER_ENTRIES_REQUEST',
    '@@GET_ALL_LEDGER_ENTRIES_SUCCESS',
    '@@GET_ALL_LEDGER_ENTRIES_ERROR'
)<
    [IGetAllLedgerEntriesPayload, undefined],
    [IGetAllLedgerEntriesResponse, undefined],
    string
>();
