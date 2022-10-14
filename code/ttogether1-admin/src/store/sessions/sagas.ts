import { call, put, takeEvery, all } from 'redux-saga/effects';
import {
    IGetAllAdHocSessionsPayload,
    getAllAdHocSessionsAsync,
    scheduleAdHocSessionAsync,
    rescheduleAdHocSessionAsync,
    IRescheduleParams,
    IScheduleParams,
    IGetAdHocSessionsByUserIdPayload,
    getAdHocSessionsByUserIdAsync,
    IRescheduleAdHocSessionPayload,
    IScheduleAdHocSessionPayload,
    IDeleteAdHocSessionPayload,
    deleteAdHocSessionAsync,
    IGetMyAdHocSessionsPayload,
    getMyAdHocSessionsAsync
} from './actions';
import axios from 'util/Api';
import { AxiosResponse } from 'axios';
import { IAdHocSession } from 'types/session';
import { snackbarShow } from 'store/ui/snackbar/actions';
import _ from 'lodash';

function getAllAdHocSessionsAPI(payload: IGetAllAdHocSessionsPayload) {
    return axios.get('/adhoc-sessions/schedule', { params: payload });
}

function* getAllAdHocSessions(
    action: ReturnType<typeof getAllAdHocSessionsAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<IAdHocSession[]> = yield call(
            getAllAdHocSessionsAPI,
            action.payload
        );
        if (status === 200) {
            const byCurrent = data
                .filter(session => session && session._id)
                .map(session => session._id);

            const adhocSessions = data
                .filter(session => session && session._id)
                .map(session => ({
                    [session._id]: session
                }));

            const adhocSessionCollection = Object.assign({}, ...adhocSessions);
            yield put(
                getAllAdHocSessionsAsync.success({
                    collection: adhocSessionCollection,
                    byCurrent
                })
            );
        } else {
            yield put(getAllAdHocSessionsAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getAllAdHocSessionsAsync.failure(err));
    }
}

function getMyAdHocSessionsAPI(payload: IGetMyAdHocSessionsPayload) {
    return axios.get('/adhoc-sessions/schedule', {
        params: payload
    });
}

function* getMyAdHocSessions(
    action: ReturnType<typeof getMyAdHocSessionsAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<IAdHocSession[]> = yield call(
            getMyAdHocSessionsAPI,
            action.payload
        );
        if (status === 200) {
            const byId = data.map(session => session._id);
            const adhocSessionCollection = Object.assign(
                {},
                ...data.map(sessions => ({
                    [sessions._id]: sessions
                }))
            );
            yield put(
                getMyAdHocSessionsAsync.success({
                    byId,
                    collection: adhocSessionCollection
                })
            );
        } else {
            yield put(getMyAdHocSessionsAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getMyAdHocSessionsAsync.failure(err));
    }
}

function getAdHocSessionsByUserIdAPI(
    payload: IGetAdHocSessionsByUserIdPayload
) {
    return axios.get('/adhoc-sessions/schedule', { params: payload });
}

function* getAdHocSessionsByUserId(
    action: ReturnType<typeof getAdHocSessionsByUserIdAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<IAdHocSession[]> = yield call(
            getAdHocSessionsByUserIdAPI,
            action.payload
        );
        if (status === 200) {
            const byId = data.map(session => session._id);
            const adhocSessionCollection = Object.assign(
                {},
                ...data.map(sessions => ({
                    [sessions._id]: sessions
                }))
            );
            yield put(
                getAdHocSessionsByUserIdAsync.success({
                    userId: action.payload.userId,
                    byId,
                    collection: adhocSessionCollection
                })
            );
        } else {
            yield put(getAdHocSessionsByUserIdAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getAdHocSessionsByUserIdAsync.failure(err));
    }
}

function scheduleAdHocSessionAPI(payload: IScheduleAdHocSessionPayload) {
    return axios.post(`/adhoc-sessions`, payload.scheduleParams);
}

function* scheduleAdHocSession(
    action: ReturnType<typeof scheduleAdHocSessionAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<IAdHocSession> = yield call(
            scheduleAdHocSessionAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                scheduleAdHocSessionAsync.success({
                    userId: action.payload.userId,
                    session: data
                })
            );
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully scheduled session!'
                })
            );
        } else {
            yield put(scheduleAdHocSessionAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(scheduleAdHocSessionAsync.failure(err));
    }
}

function rescheduleAdHocSessionAPI(payload: IRescheduleAdHocSessionPayload) {
    return axios.post(`/adhoc-sessions/reschedule`, payload.scheduleParams);
}

function* rescheduleAdHocSession(
    action: ReturnType<typeof rescheduleAdHocSessionAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<IAdHocSession> = yield call(
            rescheduleAdHocSessionAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                rescheduleAdHocSessionAsync.success({
                    userId: action.payload.userId,
                    session: data
                })
            );
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully rescheduled session!'
                })
            );
        } else {
            yield put(rescheduleAdHocSessionAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(rescheduleAdHocSessionAsync.failure(err));
    }
}

function deleteAdHocSessionAPI(payload: IDeleteAdHocSessionPayload) {
    return axios.delete(`/adhoc-sessions/${payload.acronym}`);
}

function* deleteAdHocSession(
    action: ReturnType<typeof deleteAdHocSessionAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<number> = yield call(
            deleteAdHocSessionAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                deleteAdHocSessionAsync.success({
                    sessionId: action.payload.sessionId,
                    deletedCount: data
                })
            );
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully deleted session!'
                })
            );
        } else {
            yield put(deleteAdHocSessionAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(deleteAdHocSessionAsync.failure(err));
    }
}

export function* mainSaga() {
    yield all([
        yield takeEvery(getAllAdHocSessionsAsync.request, getAllAdHocSessions),
        yield takeEvery(getMyAdHocSessionsAsync.request, getMyAdHocSessions),

        yield takeEvery(
            getAdHocSessionsByUserIdAsync.request,
            getAdHocSessionsByUserId
        ),
        yield takeEvery(
            scheduleAdHocSessionAsync.request,
            scheduleAdHocSession
        ),
        yield takeEvery(
            rescheduleAdHocSessionAsync.request,
            rescheduleAdHocSession
        ),
        yield takeEvery(deleteAdHocSessionAsync.request, deleteAdHocSession)
    ]);
}
