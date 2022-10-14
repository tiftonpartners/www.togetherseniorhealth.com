import { createAction, createAsyncAction } from 'typesafe-actions';
import { IProgram, IProgramCollectionDTO } from 'types/program';

export interface IGetMyProgramsPayload {}

export interface IGetMyProgramsResponse {
    collection: IProgramCollectionDTO;
    byAcronym: string[];
    all: boolean;
}

export const getMyProgramsAsync = createAsyncAction(
    '@@GET_MY_PROGRAMS_REQUEST',
    '@@GET_MY_PROGRAMS_SUCCESS',
    '@@GET_MY_PROGRAMS_ERROR'
)<
    [IGetMyProgramsPayload, undefined],
    [IGetMyProgramsResponse, undefined],
    string
>();

export interface IGetAllProgramsPayload {}

export interface IGetAllProgramsResponse {
    collection: IProgramCollectionDTO;
    byAcronym: string[];
}

export const getAllProgramsAsync = createAsyncAction(
    '@@GET_ALL_PROGRAMS_REQUEST',
    '@@GET_ALL_PROGRAMS_SUCCESS',
    '@@GET_ALL_PROGRAMS_ERROR'
)<
    [IGetAllProgramsPayload, undefined],
    [IGetAllProgramsResponse, undefined],
    string
>();
