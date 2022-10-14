import { IRecording, IRecordingFile } from 'types/recording';
import { createAsyncAction } from 'typesafe-actions';

export interface IGetAllRecordingsPayload {}

export interface IGetAllRecordingsResponse {
    recordings: IRecording[];
}
export const getAllRecordingsAsync = createAsyncAction(
    '@@GET_ALL_RECORDINGS_REQUEST',
    '@@GET_ALL_RECORDINGS_SUCCESS',
    '@@GET_ALL_RECORDINGS_ERROR'
)<
    [IGetAllRecordingsPayload, undefined],
    [IGetAllRecordingsResponse, undefined],
    string
>();

export interface IGetClassRecordingsByAcronymPayload {
    acronym: string;
}

export interface IGetClassRecordingsByAcronymResponse {
    acronym: string;
    recordings: IRecordingFile[];
}
export const getClassRecordingsByAcronymAsync = createAsyncAction(
    '@@GET_CLASS_RECORDINGS_BY_ACRONYM_REQUEST',
    '@@GET_CLASS_RECORDINGS_BY_ACRONYM_SUCCESS',
    '@@GET_CLASS_RECORDINGS_BY_ACRONYM_ERROR'
)<
    [IGetClassRecordingsByAcronymPayload, undefined],
    [IGetClassRecordingsByAcronymResponse, undefined],
    string
>();

export interface IGetClassRecordingsBySIDPayload {
    sid: string;
}

export interface IGetClassRecordingsBySIDResponse {
    sid: string;
    recordings: IRecordingFile[];
}
export const getClassRecordingsBySIDAsync = createAsyncAction(
    '@@GET_CLASS_RECORDINGS_BY_SID_REQUEST',
    '@@GET_CLASS_RECORDINGS_BY_SID_SUCCESS',
    '@@GET_CLASS_RECORDINGS_BY_SID_ERROR'
)<
    [IGetClassRecordingsBySIDPayload, undefined],
    [IGetClassRecordingsBySIDResponse, undefined],
    string
>();
