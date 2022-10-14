import _ from 'lodash';
import {
    createSelector,
    createSelectorCreator,
    defaultMemoize,
    Selector
} from 'reselect';
import { IProgram, IProgramCollectionDTO } from 'types/program';
import { RootState } from 'typesafe-actions';

export const getProgramsCollection: Selector<
    RootState,
    IProgramCollectionDTO
> = state => state.programs.collection;

export const getMyProgramsAcronyms: Selector<RootState, string[]> = state =>
    state.programs.me.byAcronym;

export const getAllProgramsAcronyms: Selector<RootState, string[]> = state =>
    state.programs.all.byAcronym;

const compareByAcronym = (
    a: string[] | IProgramCollectionDTO,
    b: string[] | IProgramCollectionDTO
) => {
    if (Array.isArray(a)) {
        if (a.length !== b.length || !_.isEqual(a, b)) {
            return false;
        }
    } else if (!_.isEqual(a, b)) {
        return false;
    }
    return true;
};

const createMyAcronymComparatorSelector = createSelectorCreator<any>(
    defaultMemoize,
    compareByAcronym
);
export const getMyPrograms = createMyAcronymComparatorSelector<
    RootState,
    IProgramCollectionDTO,
    string[],
    IProgram[] | undefined
>(
    [getProgramsCollection, getMyProgramsAcronyms],
    (programsCollection, myPrograms) => {
        let programs: IProgram[] = [];

        for (const key in programsCollection) {
            if (myPrograms.includes(key)) {
                programs.push(programsCollection[key]);
            }
        }
        return programs.length === 0 ? undefined : programs;
    }
);

const createAllAcronymComparatorSelector = createSelectorCreator<any>(
    defaultMemoize,
    compareByAcronym
);
export const getAllPrograms = createAllAcronymComparatorSelector<
    RootState,
    IProgramCollectionDTO,
    string[],
    IProgram[] | undefined
>(
    [getProgramsCollection, getAllProgramsAcronyms],
    (programsCollection, allPrograms) => {
        let programs: IProgram[] = [];

        for (const key in programsCollection) {
            if (allPrograms.includes(key)) {
                programs.push(programsCollection[key]);
            }
        }
        return programs.length === 0 ? undefined : programs;
    }
);

export const makeGetProgram = (acronym: string) => {
    return createSelector<RootState, IProgramCollectionDTO, IProgram>(
        [getProgramsCollection],
        collection => {
            if (collection[acronym]) {
                return collection[acronym];
            }
            return undefined;
        }
    );
};
