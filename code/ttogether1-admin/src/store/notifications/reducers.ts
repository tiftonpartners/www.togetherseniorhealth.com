import { combineReducers } from 'redux';
import { IEmailLedgerCollectionDTO } from 'types/notification';
import { createReducer } from 'typesafe-actions';
import { getAllLedgerEntriesAsync } from './actions';

export const collection = createReducer(
    {} as IEmailLedgerCollectionDTO
).handleAction(getAllLedgerEntriesAsync.success, (state, action) => {
    return {
        ...state,
        ...action.payload.collection
    };
});

export const loading = createReducer(true as boolean)
    .handleAction([getAllLedgerEntriesAsync.request], () => true)
    .handleAction(
        [getAllLedgerEntriesAsync.success, getAllLedgerEntriesAsync.failure],
        () => false
    );

export const byDate = createReducer([] as string[]).handleAction(
    [getAllLedgerEntriesAsync.success],
    (state, action) => {
        return action.payload.byDate;
    }
);

const reducer = combineReducers({
    collection,
    loading,
    byDate
});

export default reducer;
export type NotificationsState = ReturnType<typeof reducer>;
