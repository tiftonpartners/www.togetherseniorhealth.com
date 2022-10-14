import { createAction } from 'typesafe-actions';

export const updateProgramSelection = createAction(
    '@@UPDATE_PROGRAM_SELECTION'
)<string>();

export interface IUpdateClassSelectionPayload {
    courseAcronym: string;
    classAcronym: string;
}

export const updateClassSelection = createAction('@@UPDATE_CLASS_SELECTION')<
    IUpdateClassSelectionPayload
>();
