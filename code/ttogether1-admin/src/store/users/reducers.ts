import _ from 'lodash';
import { combineReducers } from 'redux';
import update from 'immutability-helper';
import {
    assignUserToClassByIdAsync,
    removeUserFromClassByIdAsync
} from 'store/classes/actions';
import { IAVUser, IAVUserCollectionDTO, User } from 'types/user';
import { createReducer } from 'typesafe-actions';
import {
    addUser,
    cancelAddUser,
    closeUserByIdAsync,
    createUserAsync,
    deleteUserAsync,
    getAllUsersAsync,
    getAVUserAsync,
    getUserAsync,
    getUserByIdAsync,
    getUserNumberAsync,
    makeParticipantByIdAsync,
    toggleEditUser,
    updateUserAsync
} from './actions';
import { IUserInfoCollectionDTO } from 'types/auth0';

export const collection = createReducer({} as IAVUserCollectionDTO)
    .handleAction([getAllUsersAsync.success], (state, action) => {
        return {
            ...state,
            ...action.payload.collection
        };
    })
    .handleAction(
        [createUserAsync.success, getUserAsync.success, getAVUserAsync.success],
        (state, action) => {
            return {
                ...state,
                [action.payload.user._id]: {
                    ...action.payload.user,
                    editing: false
                }
            };
        }
    )
    .handleAction(
        [
            updateUserAsync.success,
            makeParticipantByIdAsync.success,
            closeUserByIdAsync.success,
            assignUserToClassByIdAsync.success,
            removeUserFromClassByIdAsync.success
        ],
        (state, action) => {
            if (!action.payload.user) return state;
            let userId = action.payload.user._id;
            if (state.hasOwnProperty(userId)) {
                return update(state, {
                    [userId]: { $merge: action.payload.user }
                });
            } else {
                return update(state, {
                    [userId]: { $set: action.payload.user as IAVUser }
                });
            }
        }
    )
    .handleAction([deleteUserAsync.success], (state, action) => {
        let userId = action.payload.userId;
        if (state.hasOwnProperty(userId)) {
            return update(state, {
                $unset: [userId]
            });
        }

        return state;
    });

export const userNumbers = createReducer(
    {} as { [key: string]: string }
).handleAction(getUserNumberAsync.success, (state, action) => {
    return {
        ...state,
        [action.payload.id]: action.payload.userNumber
    };
});

export const infoCollection = createReducer(
    {} as IUserInfoCollectionDTO
).handleAction(getUserByIdAsync.success, (state, action) => {
    return {
        ...state,
        [action.payload.id]: {
            ...action.payload.user
        }
    };
});
export const add = createReducer({} as IAVUser)
    .handleAction(addUser, (state, action) => {
        return new User();
    })
    .handleAction(cancelAddUser, (state, action) => {
        return {} as IAVUser;
    })
    .handleAction(createUserAsync.success, (state, action) => {
        return {} as IAVUser;
    });

export const editing = createReducer([] as string[])
    .handleAction(toggleEditUser, (state, action) => {
        let index = state.findIndex(id => id === action.payload.userId);
        if (index === -1) {
            return update(state, { $push: [action.payload.userId] });
        } else {
            return update(state, { $splice: [[index, 1]] });
        }
    })
    .handleAction(
        [
            updateUserAsync.success,
            makeParticipantByIdAsync.success,
            closeUserByIdAsync.success,
            assignUserToClassByIdAsync.success,
            removeUserFromClassByIdAsync.success
        ],
        (state, action) => {
            if (!action.payload.user) return state;
            let userId = action.payload.user.userId;
            let index = state.findIndex(id => id === userId);
            return index > -1
                ? update(state, { $splice: [[index, 1]] })
                : state;
        }
    );

export const loading = createReducer(true as boolean)
    .handleAction(getAllUsersAsync.request, state => {
        return true;
    })
    .handleAction(
        [getAllUsersAsync.failure, getAllUsersAsync.success],
        state => {
            return false;
        }
    );

const reducer = combineReducers({
    loading,
    add,
    editing,
    collection,
    userNumbers,
    infoCollection
});

export default reducer;
export type UsersState = ReturnType<typeof reducer>;
