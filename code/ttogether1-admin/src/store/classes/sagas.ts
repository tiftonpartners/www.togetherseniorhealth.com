import { call, put, takeEvery, all } from 'redux-saga/effects';
import {
    assignUserToClassByIdAsync,
    createClassAsync,
    crossProgramConfirmToggle,
    deleteClassByIdAsync,
    deleteSessionAsync,
    getClassByIdAsync,
    getClassesByCourseAcronymAsync,
    getClassesByUserIdAsync,
    getClassesForMeAsync,
    IAssignUserToClassByIdPayload,
    ICreateClassPayload,
    IDeleteClassByIdPayload,
    IDeleteSessionPayload,
    IRemoveUserFromClassByIdPayload,
    IScheduleSessionsForClassPayload,
    ISkipSessionPayload,
    IUpdateClassPayload,
    IUpdateSessionPayload,
    removeUserFromClassByIdAsync,
    scheduleSessionsForClassAsync,
    skipSessionAsync,
    updateClassAsync,
    updateSessionAsync
} from './actions';
import axios from 'util/Api';
import { AxiosResponse, ResponseType } from 'axios';
import { IClass } from 'types/class';
import { IClassSession } from 'types/session';
import { snackbarShow } from 'store/ui/snackbar/actions';
import { IAVUser } from 'types/user';
import _ from 'lodash';
import { useModal } from 'util/modals';
import ConfirmModal, { IConfirmModalProps } from 'util/modals/ConfirmModal';

function getClassesForMeAPI() {
    return axios.get('/classes/me');
}

function* getClassesForMe(
    action: ReturnType<typeof getClassesForMeAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<IClass[]> = yield call(
            getClassesForMeAPI
        );
        if (status === 200) {
            yield put(getClassesForMeAsync.success(data));
        } else {
            yield put(getClassesForMeAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getClassesForMeAsync.failure(err));
    }
}

function getClassesByUserIdAPI(userId: string) {
    return axios.get(`/classes/user/${userId}/all`);
}

function* getClassesByUserId(
    action: ReturnType<typeof getClassesByUserIdAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<IClass[]> = yield call(
            getClassesByUserIdAPI,
            action.payload.userId
        );

        if (status === 200) {
            yield put(
                getClassesByUserIdAsync.success({
                    userId: action.payload.userId,
                    classes: data
                })
            );
        } else {
            yield put(getClassesByUserIdAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getClassesByUserIdAsync.failure(err));
    }
}

function getClassesByCourseAcronymAPI(courseAcronym: string) {
    return axios.get(`/classes/${courseAcronym}`);
}

function* getClassesByCourseAcronym(
    action: ReturnType<typeof getClassesByCourseAcronymAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<IClass[]> = yield call(
            getClassesByCourseAcronymAPI,
            action.payload
        );

        if (status === 200) {
            yield put(
                getClassesByCourseAcronymAsync.success({
                    courseAcronym: action.payload,
                    classes: data
                })
            );
        } else {
            yield put(getClassesByCourseAcronymAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getClassesByCourseAcronymAsync.failure(err));
    }
}

function getClassByIdAPI(classId: string) {
    return axios.get(`/classes/id/${classId}`);
}

function* getClassById(action: ReturnType<typeof getClassByIdAsync.request>) {
    try {
        const { status, data }: AxiosResponse<IClass> = yield call(
            getClassByIdAPI,
            action.payload
        );

        if (status === 200) {
            yield put(getClassByIdAsync.success(data));
        } else {
            yield put(getClassByIdAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getClassByIdAsync.failure(err));
    }
}

function createClassAPI(payload: ICreateClassPayload) {
    return axios.post(`/classes`, payload);
}

function* createClass(action: ReturnType<typeof createClassAsync.request>) {
    try {
        const { status, data }: AxiosResponse<IClass> = yield call(
            createClassAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully created class!'
                })
            );
            yield put(
                createClassAsync.success({
                    courseAcronym: action.payload.courseAcronym,
                    class: data
                })
            );
        } else {
            yield put(createClassAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(createClassAsync.failure(err));
    }
}

function updateClassAPI(payload: IUpdateClassPayload) {
    return axios.patch(`/classes`, payload);
}

function* updateClass(action: ReturnType<typeof updateClassAsync.request>) {
    try {
        const { status, data }: AxiosResponse<IClass> = yield call(
            updateClassAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully updated class!'
                })
            );
            yield put(
                updateClassAsync.success({
                    courseAcronym: action.payload.courseAcronym,
                    class: data
                })
            );
        } else {
            yield put(updateClassAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(updateClassAsync.failure(err));
    }
}

function deleteClassByIdAPI(payload: IDeleteClassByIdPayload) {
    return axios.delete(`/classes/id/${payload.classId}`);
}

function* deleteClassById(
    action: ReturnType<typeof deleteClassByIdAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<IClass> = yield call(
            deleteClassByIdAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully deleted class!'
                })
            );
            yield put(
                deleteClassByIdAsync.success({
                    classId: data._id,
                    courseAcronym: action.payload.courseAcronym
                })
            );
        } else {
            yield put(deleteClassByIdAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(deleteClassByIdAsync.failure(err));
    }
}

function scheduleSessionsForClassAPI(
    payload: IScheduleSessionsForClassPayload
) {
    return axios.post(`/classes/sessions`, payload);
}

function* scheduleSessionsForClass(
    action: ReturnType<typeof scheduleSessionsForClassAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<IClass> = yield call(
            scheduleSessionsForClassAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                scheduleSessionsForClassAsync.success({
                    class: data
                })
            );
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully scheduled sessions for class!'
                })
            );
        } else {
            yield put(scheduleSessionsForClassAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(scheduleSessionsForClassAsync.failure(err));
    }
}

function updateSessionAPI(payload: IUpdateSessionPayload) {
    return axios.patch(
        `/classes/session/acronym/${payload.session.acronym}`,
        payload.session
    );
}

function* updateSession(action: ReturnType<typeof updateSessionAsync.request>) {
    try {
        const { status, data }: AxiosResponse<IClass> = yield call(
            updateSessionAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                updateSessionAsync.success({
                    ...action.payload,
                    class: data
                })
            );
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully updated session!'
                })
            );
        } else {
            yield put(updateSessionAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(updateSessionAsync.failure(err));
    }
}

function skipSessionAPI(payload: ISkipSessionPayload) {
    return axios.patch(
        `/classes/session/acronym/${payload.session.acronym}/skip`,
        payload.session
    );
}

function* skipSession(action: ReturnType<typeof skipSessionAsync.request>) {
    try {
        const { status, data }: AxiosResponse<IClass> = yield call(
            skipSessionAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                skipSessionAsync.success({
                    ...action.payload,
                    class: data
                })
            );
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully skipped session!'
                })
            );
        } else {
            yield put(skipSessionAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(skipSessionAsync.failure(err));
    }
}

function deleteSessionAPI(payload: IDeleteSessionPayload) {
    return axios.delete(
        `/classes/session/acronym/${payload.sessionAcronym}/delete`
    );
}

function* deleteSession(action: ReturnType<typeof deleteSessionAsync.request>) {
    try {
        const { status, data }: AxiosResponse<IClass> = yield call(
            deleteSessionAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                deleteSessionAsync.success({
                    ...action.payload,
                    class: data
                })
            );
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully deleted session!'
                })
            );
        } else {
            yield put(deleteSessionAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(deleteSessionAsync.failure(err));
    }
}

function assignUserToClassByIdAPI(payload: IAssignUserToClassByIdPayload) {
    return axios.patch(`/classes/id/${payload.classId}/user/add`, payload);
}

function* assignUserToClassById(
    action: ReturnType<typeof assignUserToClassByIdAsync.request>
) {
    try {
        const {
            status,
            data
        }: AxiosResponse<
            { user: IAVUser; class: IClass } | { crossProgram: boolean }
        > = yield call(assignUserToClassByIdAPI, action.payload);
        if (status === 200) {
            // if the user is trying to assign a user / class cross program
            // we prompt them with a confirm dialog as a warning
            if (_.get(data, 'crossProgram')) {
                yield put(crossProgramConfirmToggle());
            } else {
                yield put(
                    snackbarShow({
                        type: 'success',
                        message: 'Successfully assigned participant to class!'
                    })
                );
                yield put(
                    assignUserToClassByIdAsync.success({
                        user: (data as { user: IAVUser; class: IClass }).user,
                        class: (data as { user: IAVUser; class: IClass }).class
                    })
                );
                if (action.payload.successCallback) {
                    action.payload.successCallback();
                }
            }
        } else {
            yield put(assignUserToClassByIdAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: err.response.data
            })
        );
        yield put(assignUserToClassByIdAsync.failure(err));
    }
}

function removeUserFromClassByIdAPI(payload: IRemoveUserFromClassByIdPayload) {
    return axios.patch(`/classes/id/${payload.classId}/user/remove`, payload);
}

function* removeUserFromClassById(
    action: ReturnType<typeof removeUserFromClassByIdAsync.request>
) {
    try {
        const {
            status,
            data
        }: AxiosResponse<{ user: IAVUser; class: IClass }> = yield call(
            removeUserFromClassByIdAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully removed user from class!'
                })
            );
            yield put(
                removeUserFromClassByIdAsync.success({
                    user: data.user,
                    class: data.class
                })
            );
        } else {
            yield put(removeUserFromClassByIdAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(removeUserFromClassByIdAsync.failure(err));
    }
}

export function* mainSaga() {
    yield all([
        yield takeEvery(getClassesForMeAsync.request, getClassesForMe),
        yield takeEvery(getClassesByUserIdAsync.request, getClassesByUserId),
        yield takeEvery(getClassByIdAsync.request, getClassById),
        yield takeEvery(deleteClassByIdAsync.request, deleteClassById),
        yield takeEvery(
            getClassesByCourseAcronymAsync.request,
            getClassesByCourseAcronym
        ),
        yield takeEvery(createClassAsync.request, createClass),
        yield takeEvery(updateClassAsync.request, updateClass),
        yield takeEvery(
            scheduleSessionsForClassAsync.request,
            scheduleSessionsForClass
        ),
        yield takeEvery(updateSessionAsync.request, updateSession),
        yield takeEvery(skipSessionAsync.request, skipSession),
        yield takeEvery(deleteSessionAsync.request, deleteSession),

        yield takeEvery(
            assignUserToClassByIdAsync.request,
            assignUserToClassById
        ),
        yield takeEvery(
            removeUserFromClassByIdAsync.request,
            removeUserFromClassById
        )
    ]);
}
