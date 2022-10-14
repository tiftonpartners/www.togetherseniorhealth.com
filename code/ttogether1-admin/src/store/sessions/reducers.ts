import _ from 'lodash';
import moment from 'moment-timezone';
import { combineReducers } from 'redux';
import { IAdHocSessionsCollectionDTO } from 'types/session';
import { createReducer } from 'typesafe-actions';
import {
    deleteAdHocSessionAsync,
    getAdHocSessionsByUserIdAsync,
    getAllAdHocSessionsAsync,
    getMyAdHocSessionsAsync,
    rescheduleAdHocSessionAsync,
    scheduleAdHocSessionAsync
} from './actions';

export const getDateDisplay = (date: string, tz: string) => {
    return `${moment(date)
        .tz(tz)
        .format('L hh:mm A')}
    ${moment.tz(tz).zoneAbbr()}`;
};
export const collection = createReducer({} as IAdHocSessionsCollectionDTO)
    .handleAction(
        [
            getAllAdHocSessionsAsync.success,
            getMyAdHocSessionsAsync.success,
            getAdHocSessionsByUserIdAsync.success
        ],
        (state, action) => {
            const coll = action.payload.collection;
            for (const key in coll) {
                let session = coll[key];
                session.dateDisplay = getDateDisplay(
                    session.scheduledStartTime,
                    session.tz
                );
            }
            return {
                ...state,
                ...coll
            };
        }
    )
    .handleAction(
        [
            scheduleAdHocSessionAsync.success,
            rescheduleAdHocSessionAsync.success
        ],
        (state, action) => {
            let session = action.payload.session;
            session.dateDisplay = getDateDisplay(
                session.scheduledStartTime,
                session.tz
            );
            return {
                ...state,
                [session._id]: {
                    ...session
                }
            };
        }
    )
    .handleAction(deleteAdHocSessionAsync.success, (state, action) => {
        return _.omit(state, [action.payload.sessionId]);
    });
export const byUserId = createReducer({} as { [key: string]: string[] })
    .handleAction([getAdHocSessionsByUserIdAsync.success], (state, action) => {
        return {
            ...state,
            [action.payload.userId]: [...action.payload.byId]
        };
    })
    .handleAction(
        [
            scheduleAdHocSessionAsync.success,
            rescheduleAdHocSessionAsync.success
        ],
        (state, action) => {
            const isArr = Array.isArray(state[action.payload.userId]);
            const inArr =
                isArr &&
                state[action.payload.userId].indexOf(
                    action.payload.session._id
                ) > -1;
            const arr = (_.get(state, action.payload.userId) || []).concat(
                action.payload.session._id
            );

            if (inArr) {
                return state;
            }
            return {
                ...state,
                [action.payload.userId]: arr
            };
        }
    )
    .handleAction(deleteAdHocSessionAsync.success, (state, action) => {
        const result = Object.keys(state).reduce((result, userId) => {
            const index = state[userId].indexOf(action.payload.sessionId);
            const arr = [...state[userId]];
            if (index > -1) {
                arr.splice(index, 1);
                result[userId] = arr;
            } else {
                result[userId] = state[userId];
            }

            return result;
        }, {});
        return result;
    });
export const my = createReducer([] as string[])
    .handleAction([getMyAdHocSessionsAsync.success], (state, action) => {
        return [...action.payload.byId];
    })

    .handleAction(deleteAdHocSessionAsync.success, (state, action) => {
        const index = state.indexOf(action.payload.sessionId);
        let arr = [...state];
        if (index > -1) {
            arr.splice(index, 1);
        }

        return arr;
    });

export const current = createReducer([] as string[])
    .handleAction([getAllAdHocSessionsAsync.success], (state, action) => {
        return [...action.payload.byCurrent];
    })

    .handleAction(deleteAdHocSessionAsync.success, (state, action) => {
        const index = state.indexOf(action.payload.sessionId);
        let arr = [...state];
        if (index > -1) {
            arr.splice(index, 1);
        }

        return arr;
    });

export const loading = createReducer(true as boolean)
    .handleAction(
        [getAllAdHocSessionsAsync.request, getMyAdHocSessionsAsync.request],
        state => {
            return true;
        }
    )
    .handleAction(
        [
            getAllAdHocSessionsAsync.failure,
            getAllAdHocSessionsAsync.success,
            getMyAdHocSessionsAsync.failure,
            getMyAdHocSessionsAsync.success
        ],
        state => {
            return false;
        }
    );
const reducer = combineReducers({
    collection,
    byUserId,
    my,
    current,
    loading
});

export default reducer;
export type AdHocSessionsState = ReturnType<typeof reducer>;
