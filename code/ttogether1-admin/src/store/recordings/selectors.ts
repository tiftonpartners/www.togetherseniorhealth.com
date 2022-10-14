import _ from 'lodash';
import { createSelector, Selector } from 'reselect';
import { IClass, IClassCollectionDTO } from 'types/class';
import { IRecordingFile } from 'types/recording';
import { IClassSession } from 'types/session';
import { RootState } from 'typesafe-actions';

const getRecordingCollection: Selector<
    RootState,
    Record<string, IRecordingFile>
> = state => state.recordings.collection;

const getRecordingIdsBySessionAcronym: Selector<
    RootState,
    Record<string, string[]>
> = state => state.recordings.bySessionAcronym;

export const makeGetRecordingsBySessionAcronym = (sessionAcronym: string) => {
    return createSelector<
        RootState,
        Record<string, string[]>,
        Record<string, IRecordingFile>,
        IRecordingFile[]
    >(
        [getRecordingIdsBySessionAcronym, getRecordingCollection],
        (recordingsByAcronym, collection) => {
            const recordingIds = _.get(
                recordingsByAcronym,
                sessionAcronym,
                [] as string[]
            );
            const recordings = recordingIds.map(id => _.get(collection, id));
            return recordings && recordings.length > 0 ? recordings : undefined;
        }
    );
};
