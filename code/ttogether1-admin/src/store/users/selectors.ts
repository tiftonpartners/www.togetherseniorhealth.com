import _ from 'lodash';
import { createSelector, Selector } from 'reselect';
import { IUserInfo, IUserInfoCollectionDTO } from 'types/auth0';
import { IAVUser, IAVUserCollectionDTO, UserState, UserType } from 'types/user';
import { RootState } from 'typesafe-actions';

export const getUsersCollection: Selector<
    RootState,
    IAVUserCollectionDTO
> = state => state.users.collection;

export const getUsersInfoCollection: Selector<
    RootState,
    IUserInfoCollectionDTO
> = state => state.users.infoCollection;

export const getProspectsCollection = createSelector<
    RootState,
    IAVUserCollectionDTO,
    IAVUserCollectionDTO
>([getUsersCollection], usersCollection => {
    let collection: IAVUserCollectionDTO = {};

    for (const key in usersCollection) {
        if (usersCollection[key].__t === UserType.Prospect) {
            collection[key] = usersCollection[key];
        }
    }
    return collection;
});

export const makeGetUserCollectionByState = (
    userType: UserType,
    userState: UserState,
    program: string
) => {
    return createSelector<
        RootState,
        IAVUserCollectionDTO,
        IAVUserCollectionDTO
    >([getUsersCollection], usersCollection => {
        let collection: IAVUserCollectionDTO = {};

        for (const key in usersCollection) {
            if (
                usersCollection[key].__t === userType &&
                usersCollection[key].state === userState &&
                (program === 'ALL' || usersCollection[key].program === program)
            ) {
                collection[key] = usersCollection[key];
            }
        }
        return _.isEmpty(collection) ? undefined : collection;
    });
};
export const makeGetUser = (userId: string) => {
    return createSelector<RootState, IAVUserCollectionDTO, IAVUser>(
        [getUsersCollection],
        collection => {
            for (const key in collection) {
                if (collection[key].userId === userId) {
                    return collection[key];
                }
            }
            return undefined;
        }
    );
};

export const makeGetUserInfo = (userId: string) => {
    return createSelector<RootState, IUserInfoCollectionDTO, IUserInfo>(
        [getUsersInfoCollection],
        collection => {
            if (collection[userId]) {
                return collection[userId];
            }
            return undefined;
        }
    );
};

export const getUsersEditing: Selector<RootState, string[]> = state =>
    state.users.editing;

export const makeGetIsUserEditing = (userId: string) => {
    return createSelector<RootState, string[], boolean>(
        [getUsersEditing],
        collection => {
            return collection.findIndex(id => id === userId) > -1;
        }
    );
};

export const getUserNumbers: Selector<
    RootState,
    { [key: string]: string }
> = state => state.users.userNumbers;

export const makeGetUserNumber = (userId: string) => {
    return createSelector<RootState, { [key: string]: string }, string>(
        [getUserNumbers],
        collection => {
            return _.get(collection, userId);
        }
    );
};
