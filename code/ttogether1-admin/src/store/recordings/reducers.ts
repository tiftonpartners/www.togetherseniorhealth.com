import { combineReducers } from 'redux';
import { createReducer } from 'typesafe-actions';
import {
    getAllRecordingsAsync,
    getClassRecordingsByAcronymAsync,
    getClassRecordingsBySIDAsync
} from './actions';
import update from 'immutability-helper';
import _ from 'lodash';
import { IRecording, IRecordingFile } from 'types/recording';

export const collection = createReducer(
    {} as Record<string, IRecordingFile>
).handleAction(
    [
        getClassRecordingsByAcronymAsync.success,
        getClassRecordingsBySIDAsync.success
    ],
    (state, action) => {
        const recordings = action.payload.recordings.reduce((prev, cur) => {
            if (state.hasOwnProperty(cur.sid)) {
                prev[cur.sid] = { $merge: cur };
            } else {
                prev[cur.sid] = { $set: cur };
            }
            return prev;
        }, {});
        return update(state, recordings);
    }
);

export const entries = createReducer([] as IRecording[]).handleAction(
    [getAllRecordingsAsync.success],
    (state, action) => {
        return action.payload.recordings;
    }
);

export const bySessionAcronym = createReducer(
    {} as { [sessionAcronym: string]: string[] }
).handleAction(getClassRecordingsByAcronymAsync.success, (state, action) => {
    let sessionAcronym = action.payload.acronym;
    return {
        ...state,
        [sessionAcronym]: action.payload.recordings.map(r => r.sid)
    };
});

export const loading = createReducer(true as boolean)
    .handleAction(getAllRecordingsAsync.request, state => {
        return true;
    })
    .handleAction(
        [getAllRecordingsAsync.failure, getAllRecordingsAsync.success],
        state => {
            return false;
        }
    );

const reducer = combineReducers({
    collection,
    entries,
    bySessionAcronym,
    loading
});

export default reducer;
export type RecordingsState = ReturnType<typeof reducer>;
