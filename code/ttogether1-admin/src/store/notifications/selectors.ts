import _ from 'lodash';
import { createSelector, Selector } from 'reselect';
import {
    IEmailLedger,
    IEmailLedgerCollectionDTO,
    IEmailLedgerGroup
} from 'types/notification';
import { RootState } from 'typesafe-actions';

const getLedgerCollection: Selector<
    RootState,
    IEmailLedgerCollectionDTO
> = state => state.notifications.collection;

const getLedgerEntriesByDate: Selector<RootState, string[]> = state =>
    state.notifications.byDate;

export const makeGetLedgerEntriesByDate = () => {
    return createSelector<
        RootState,
        IEmailLedgerCollectionDTO,
        string[],
        IEmailLedgerGroup[]
    >(
        [getLedgerCollection, getLedgerEntriesByDate],
        (collection, batchIdsByDate) => {
            return batchIdsByDate.map(id => _.get(collection, id));
        }
    );
};

export const makeGetLedgerEntryByBatchId = (batchId: string) => {
    return createSelector<
        RootState,
        IEmailLedgerCollectionDTO,
        IEmailLedgerGroup
    >([getLedgerCollection], collection => {
        return _.get(collection, batchId);
    });
};
