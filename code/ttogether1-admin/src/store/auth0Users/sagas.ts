import { call, put, takeEvery, all, takeLeading } from 'redux-saga/effects';
import {
    getAllAuth0RolesAsync,
    getAllAuth0UsersAsync,
    getAuth0RolesByUserAsync,
    getAuth0UsersByRoleAsync,
    getTicketForAuth0UserAsync,
    IGetAuth0RolesByUserPayload,
    IGetAuth0UsersByRolePayload,
    IUpdateAuth0UserRolesPayload,
    updateAuth0UserAsync,
    updateAuth0UserRolesAsync
} from './actions';
import axios from 'util/Api';
import { AxiosResponse } from 'axios';
import { IAuth0User, IAuth0UserCollectionDTO } from 'types/auth0';
import { Role, User, UserData as Auth0UserData } from 'auth0';
import { snackbarShow } from 'store/ui/snackbar/actions';
import _ from 'lodash';

function getAllAuth0UsersAPI() {
    return axios.get('/users/auth0');
}

function* getAllAuth0Users(
    action: ReturnType<typeof getAllAuth0UsersAsync.request>
) {
    try {
        const {
            status,
            data
        }: AxiosResponse<IAuth0UserCollectionDTO> = yield call(
            getAllAuth0UsersAPI
        );
        if (status === 200) {
            yield put(getAllAuth0UsersAsync.success(data));
        } else {
            yield put(getAllAuth0UsersAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getAllAuth0UsersAsync.failure(err));
    }
}

function getTicketForAuth0UserAPI(id: string) {
    return axios.put(`/pwdless/ticket/user/${id}`);
}

function* getTicketForAuth0User(
    action: ReturnType<typeof getTicketForAuth0UserAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<{ ticket: string }> = yield call(
            getTicketForAuth0UserAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                getTicketForAuth0UserAsync.success({
                    id: action.payload,
                    ticket: data.ticket
                })
            );
        } else {
            yield put(getTicketForAuth0UserAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getTicketForAuth0UserAsync.failure(err));
    }
}

function updateAuth0UserAPI(id: string, data: Partial<Auth0UserData>) {
    return axios.patch(`/users/auth0/${id}`, data);
}

function* updateAuth0User(
    action: ReturnType<typeof updateAuth0UserAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<User> = yield call(
            updateAuth0UserAPI,
            action.payload.userId,
            action.payload.user
        );
        if (status === 200) {
            yield put(
                updateAuth0UserAsync.success({
                    userId: action.payload.userId,
                    user: data
                })
            );
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully updated user!'
                })
            );
        } else {
            yield put(updateAuth0UserAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(updateAuth0UserAsync.failure(err));
    }
}

function getUsersByRoleAPI(payload: IGetAuth0UsersByRolePayload) {
    return axios.get(`/users/role/${payload.role}`);
}

function* getUsersByRole(
    action: ReturnType<typeof getAuth0UsersByRoleAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<IAuth0User[]> = yield call(
            getUsersByRoleAPI,
            action.payload
        );
        if (status === 200) {
            const byRole = data.map(user => user.user_id);
            const userCollection = Object.assign(
                {},
                ...data.map(user => ({
                    [user.user_id]: user
                }))
            );
            yield put(
                getAuth0UsersByRoleAsync.success({
                    role: action.payload.role,
                    byRole,
                    collection: userCollection
                })
            );
        } else {
            yield put(getAuth0UsersByRoleAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getAuth0UsersByRoleAsync.failure(err));
    }
}

function getAllAuth0RolesAPI() {
    return axios.get('/users/auth0/roles');
}

function* getAllAuth0Roles(
    action: ReturnType<typeof getAllAuth0RolesAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<Role[]> = yield call(
            getAllAuth0RolesAPI
        );
        if (status === 200) {
            const collection = Object.assign(
                {},
                ...data.map(role => ({
                    [role.id]: role
                }))
            );
            yield put(getAllAuth0RolesAsync.success({ collection }));
        } else {
            yield put(getAllAuth0RolesAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getAllAuth0RolesAsync.failure(err));
    }
}

function getAuth0RolesByUserAPI(payload: IGetAuth0RolesByUserPayload) {
    return axios.get(`/users/auth0/roles/${payload.userId}`);
}

function* getAuth0RolesByUser(
    action: ReturnType<typeof getAuth0RolesByUserAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<Role[]> = yield call(
            getAuth0RolesByUserAPI,
            action.payload
        );
        if (status === 200) {
            const collection = Object.assign(
                {},
                ...data.map(role => ({
                    [role.id]: role
                }))
            );
            const roles = data.map(role => role.id);
            yield put(
                getAuth0RolesByUserAsync.success({
                    collection,
                    userId: action.payload.userId,
                    roles
                })
            );
        } else {
            yield put(getAuth0RolesByUserAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getAuth0RolesByUserAsync.failure(err));
    }
}

function updateAuth0UserRolesAPI(payload: IUpdateAuth0UserRolesPayload) {
    return axios.patch(`/users/auth0/roles/${payload.userId}`, {
        roles: payload.roles
    });
}

function* updateAuth0UserRoles(
    action: ReturnType<typeof updateAuth0UserRolesAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<Role[]> = yield call(
            updateAuth0UserRolesAPI,
            action.payload
        );
        if (status === 200) {
            const collection = Object.assign(
                {},
                ...data.map(role => ({
                    [role.id]: role
                }))
            );
            const roles = data.map(role => role.id);
            yield put(
                updateAuth0UserRolesAsync.success({
                    collection,
                    userId: action.payload.userId,
                    roles
                })
            );
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully updated user!'
                })
            );
        } else {
            yield put(updateAuth0UserRolesAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(updateAuth0UserRolesAsync.failure(err));
    }
}

export function* mainSaga() {
    yield all([
        yield takeEvery(getAllAuth0UsersAsync.request, getAllAuth0Users),
        yield takeEvery(
            getTicketForAuth0UserAsync.request,
            getTicketForAuth0User
        ),
        yield takeEvery(updateAuth0UserAsync.request, updateAuth0User),
        yield takeLeading(getAuth0UsersByRoleAsync.request, getUsersByRole),
        yield takeLeading(getAllAuth0RolesAsync.request, getAllAuth0Roles),
        yield takeEvery(getAuth0RolesByUserAsync.request, getAuth0RolesByUser),
        yield takeEvery(updateAuth0UserRolesAsync.request, updateAuth0UserRoles)
    ]);
}
