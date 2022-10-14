import _ from 'lodash';
import { combineReducers } from 'redux';
import { createReducer } from 'typesafe-actions';
import { IProgramCollectionDTO } from 'types/program';
import { getAllProgramsAsync, getMyProgramsAsync } from './actions';

export const collection = createReducer({} as IProgramCollectionDTO)
    .handleAction([getMyProgramsAsync.success], (state, action) => {
        return {
            ...state,
            ...action.payload.collection
        };
    })
    .handleAction([getAllProgramsAsync.success], (state, action) => {
        return {
            ...state,
            ...action.payload.collection
        };
    });

export const all = createReducer({
    byAcronym: [] as string[]
}).handleAction([getAllProgramsAsync.success], (state, action) => {
    return { byAcronym: action.payload.byAcronym };
});

export const me = createReducer({
    byAcronym: [] as string[],
    all: false
}).handleAction([getMyProgramsAsync.success], (state, action) => {
    return { byAcronym: action.payload.byAcronym, all: action.payload.all };
});

const reducer = combineReducers({
    collection,
    all,
    me
});

export default reducer;
export type ProgramsState = ReturnType<typeof reducer>;
