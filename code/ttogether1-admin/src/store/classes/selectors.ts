import _ from 'lodash';
import { createSelector, Selector } from 'reselect';
import { IClass, IClassCollectionDTO } from 'types/class';
import { IClassSession } from 'types/session';
import { RootState } from 'typesafe-actions';

const getClassCollection: Selector<RootState, IClassCollectionDTO> = state =>
    state.classes.collection;

export const makeGetClass = (classId: string) => {
    return createSelector<RootState, IClassCollectionDTO, IClass>(
        [getClassCollection],
        collection => {
            return _.get(collection, classId);
        }
    );
};

const getClassIdsByCourse: Selector<
    RootState,
    { [key: string]: string[] }
> = state => state.classes.byCourse;

export const makeGetClassesByCourse = (courseAcronym: string) => {
    return createSelector<
        RootState,
        { [key: string]: string[] },
        IClassCollectionDTO,
        IClass[]
    >(
        [getClassIdsByCourse, getClassCollection],
        (classIdsByCourse, collection) => {
            const classIds = _.get(
                classIdsByCourse,
                courseAcronym,
                [] as string[]
            );
            return classIds.map(id => _.get(collection, id));
        }
    );
};

const getClassIdsByUserId: Selector<
    RootState,
    { [key: string]: string[] }
> = state => state.classes.byUserId;

export const makeGetClassesByUserId = (userId: string) => {
    return createSelector<
        RootState,
        { [key: string]: string[] },
        IClassCollectionDTO,
        IClass[]
    >(
        [getClassIdsByUserId, getClassCollection],
        (classIdsByUserId, collection) => {
            const classIds = _.get(classIdsByUserId, userId, [] as string[]);
            return classIds.map(id => _.get(collection, id));
        }
    );
};

export const makeGetClassByAcronym = (
    courseAcronym: string,
    classAcronym: string
) => {
    return createSelector<
        RootState,
        { [key: string]: string[] },
        IClassCollectionDTO,
        IClass | undefined
    >(
        [getClassIdsByCourse, getClassCollection],
        (classIdsByCourse, collection) => {
            const classIds = _.get(
                classIdsByCourse,
                courseAcronym,
                [] as string[]
            );
            const classId = classIds.filter(id => {
                const klass = _.get(collection, id);
                return klass.acronym === classAcronym;
            });
            return classId.length > 0
                ? _.get(collection, classId[0])
                : undefined;
        }
    );
};

export const makeGetClassSession = (classId: string, sessionId: string) => {
    return createSelector<RootState, IClassCollectionDTO, IClassSession>(
        [getClassCollection],
        collection => {
            const klass = _.get(collection, classId);
            const session = klass.sessions.filter(
                session => session._id === sessionId
            );
            return session[0];
        }
    );
};
