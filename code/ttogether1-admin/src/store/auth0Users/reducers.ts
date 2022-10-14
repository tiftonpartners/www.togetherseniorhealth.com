import { combineReducers } from 'redux';
import { IAuth0RoleCollectionDTO, IAuth0UserCollectionDTO } from 'types/auth0';
import { createReducer } from 'typesafe-actions';
import {
    getAllAuth0RolesAsync,
    getAllAuth0UsersAsync,
    getAuth0RolesByUserAsync,
    getAuth0UsersByRoleAsync,
    getTicketForAuth0UserAsync,
    updateAuth0UserAsync,
    updateAuth0UserRolesAsync
} from './actions';

export const loading = createReducer(true as boolean)
    .handleAction(
        [getAllAuth0UsersAsync.request, updateAuth0UserAsync.request],
        () => true
    )
    .handleAction(
        [
            getAllAuth0UsersAsync.success,
            getAllAuth0UsersAsync.failure,
            updateAuth0UserAsync.success,
            updateAuth0UserAsync.failure
        ],
        () => false
    );

export const collection = createReducer({} as IAuth0UserCollectionDTO)
    .handleAction(getAllAuth0UsersAsync.success, (state, action) => {
        return action.payload;
    })
    .handleAction(updateAuth0UserAsync.success, (state, action) => {
        if (state.hasOwnProperty(action.payload.userId)) {
            return {
                ...state,
                [action.payload.userId]: {
                    ...state[action.payload.userId],
                    ...action.payload.user
                }
            };
        }
    })
    .handleAction(getTicketForAuth0UserAsync.success, (state, action) => {
        if (state.hasOwnProperty(action.payload.id)) {
            return {
                ...state,
                [action.payload.id]: {
                    ...state[action.payload.id],
                    ticket: action.payload.ticket
                }
            };
        }
    })
    .handleAction(getAuth0UsersByRoleAsync.success, (state, action) => {
        return {
            ...state,
            ...action.payload.collection
        };
    });
export const byRole = createReducer(
    {} as { [key: string]: string[] }
).handleAction([getAuth0UsersByRoleAsync.success], (state, action) => {
    return {
        ...state,
        [action.payload.role]: [...action.payload.byRole]
    };
});

export const rolesCollection = createReducer(
    {} as IAuth0RoleCollectionDTO
).handleAction(
    [
        getAllAuth0RolesAsync.success,
        getAuth0RolesByUserAsync.success,
        updateAuth0UserRolesAsync.success
    ],
    (state, action) => {
        return {
            ...state,
            ...action.payload.collection
        };
    }
);

export const rolesByUserId = createReducer(
    {} as { [key: string]: string[] }
).handleAction(
    [getAuth0RolesByUserAsync.success, updateAuth0UserRolesAsync.success],
    (state, action) => {
        return {
            ...state,
            [action.payload.userId]: [...action.payload.roles]
        };
    }
);

const reducer = combineReducers({
    loading,
    collection,
    byRole,
    rolesCollection,
    rolesByUserId
});

export default reducer;
export type UsersState = ReturnType<typeof reducer>;
