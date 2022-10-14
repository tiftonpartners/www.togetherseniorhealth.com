import { call, put, takeEvery, all, takeLeading } from 'redux-saga/effects';
import {
    closeUserByIdAsync,
    createUserAsync,
    deleteUserAsync,
    getAllUsersAsync,
    getAVUserAsync,
    getUserAsync,
    getUserByIdAsync,
    getUserNumberAsync,
    ICloseUserByIdPayload,
    ICreateUserPayload,
    IDeleteUserPayload,
    IGetAllUsersPayload,
    IGetAVUserPayload,
    IGetUserPayload,
    IUpdateUserPayload,
    makeParticipantByIdAsync,
    updateUserAsync
    // completeProcessStepAsync,
    // getUsersByProcessTypeAsync,
    // ICompleteProcessStepPayload,
    // IRescheduleProcessStepPayload,
    // rescheduleProcessStepAsync,
} from './actions';
import axios from 'util/Api';
import { AxiosResponse } from 'axios';
import { IAVUser, IAVUserCollectionDTO, UserType } from 'types/user';
import { snackbarShow } from 'store/ui/snackbar/actions';
import _ from 'lodash';
import { IUserInfo } from 'types/auth0';

function getAllUsersAPI(payload: IGetAllUsersPayload) {
    return payload.userType === UserType.Prospect
        ? axios.get('/users/prospect/all', { params: payload })
        : axios.get('/users/participant/all', { params: payload });
}

function* getAllUsers(action: ReturnType<typeof getAllUsersAsync.request>) {
    try {
        const {
            status,
            data
        }: AxiosResponse<IAVUserCollectionDTO> = yield call(
            getAllUsersAPI,
            action.payload
        );
        if (status === 200) {
            yield put(getAllUsersAsync.success({ collection: data }));
        } else {
            yield put(getAllUsersAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getAllUsersAsync.failure(err));
    }
}

function getUserByIdAPI(id: string) {
    return axios.get(`/users/id/${id}`);
}

function* getUserById(action: ReturnType<typeof getUserByIdAsync.request>) {
    try {
        const { status, data }: AxiosResponse<IUserInfo> = yield call(
            getUserByIdAPI,
            action.payload.id
        );
        if (status === 200) {
            yield put(
                getUserByIdAsync.success({
                    id: action.payload.id,
                    user: data
                })
            );
        } else {
            yield put(getUserByIdAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getUserByIdAsync.failure(err));
    }
}

function getUserNumberAPI(id: string) {
    return axios.get(`/users/id/${id}/userNumber`);
}

function* getUserNumber(action: ReturnType<typeof getUserNumberAsync.request>) {
    try {
        const { status, data }: AxiosResponse<string> = yield call(
            getUserNumberAPI,
            action.payload.id
        );
        if (status === 200) {
            yield put(
                getUserNumberAsync.success({
                    id: action.payload.id,
                    userNumber: data
                })
            );
        } else {
            yield put(getUserNumberAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getUserNumberAsync.failure(err));
    }
}

function getAVUserAPI(payload: IGetAVUserPayload) {
    return axios.get(`/users/avuser/${payload.userId}`);
}

function* getAVUser(action: ReturnType<typeof getAVUserAsync.request>) {
    try {
        const { status, data }: AxiosResponse<IAVUser> = yield call(
            getAVUserAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                getAVUserAsync.success({
                    user: data
                })
            );
        } else {
            yield put(getAVUserAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getAVUserAsync.failure(err));
    }
}

function getUserAPI(payload: IGetUserPayload) {
    return payload.userType === UserType.Prospect
        ? axios.get(`/users/prospect/${payload.userId}`)
        : axios.get(`/users/participant/${payload.userId}`);
}

function* getUser(action: ReturnType<typeof getUserAsync.request>) {
    try {
        const { status, data }: AxiosResponse<IAVUser> = yield call(
            getUserAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                getUserAsync.success({
                    user: data
                })
            );
        } else {
            yield put(getUserAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getUserAsync.failure(err));
    }
}

function updateUserAPI(payload: IUpdateUserPayload) {
    return payload.userType === UserType.Prospect
        ? axios.patch(`/users/prospect/${payload.user.userId}`, payload.user)
        : axios.patch(
              `/users/participant/${payload.user.userId}`,
              payload.user
          );
}

function* updateUser(action: ReturnType<typeof updateUserAsync.request>) {
    try {
        const { status, data }: AxiosResponse<IAVUser> = yield call(
            updateUserAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully updated user!'
                })
            );

            yield put(
                updateUserAsync.success({
                    user: data,
                    userType: action.payload.userType
                })
            );
        } else {
            yield put(updateUserAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(updateUserAsync.failure(err));
    }
}

function createUserAPI(payload: ICreateUserPayload) {
    return payload.userType === UserType.Prospect
        ? axios.post(`/users/prospect`, payload)
        : axios.post(`/users/participant`, payload);
}

function* createUser(action: ReturnType<typeof createUserAsync.request>) {
    try {
        const { status, data }: AxiosResponse<IAVUser | string> = yield call(
            createUserAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully created user!'
                })
            );

            yield put(
                createUserAsync.success({
                    user: data as IAVUser,
                    userType: action.payload.userType
                })
            );
        } else {
            yield put(snackbarShow({ type: 'error', message: data as string }));

            yield put(createUserAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );

        yield put(createUserAsync.failure(err));
    }
}

function deleteUserAPI(payload: IDeleteUserPayload) {
    return payload.userType === UserType.Prospect
        ? axios.delete(`/users/prospect/${payload.userId}`)
        : axios.delete(`/users/participant${payload.userId}`);
}

function* deleteUser(action: ReturnType<typeof deleteUserAsync.request>) {
    try {
        const { status, data }: AxiosResponse<IAVUser | string> = yield call(
            deleteUserAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully deleted user!'
                })
            );

            yield put(
                deleteUserAsync.success({
                    userId: data as string
                })
            );
        } else {
            yield put(snackbarShow({ type: 'error', message: data as string }));

            yield put(deleteUserAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );

        yield put(deleteUserAsync.failure(err));
    }
}

function makeParticipantByIdAPI(userId: string) {
    return axios.patch(`/users/id/${userId}/makeParticipant`);
}

function* makeParticipantById(
    action: ReturnType<typeof makeParticipantByIdAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<IAVUser> = yield call(
            makeParticipantByIdAPI,
            action.payload.userId
        );
        if (status === 200) {
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully made user a participant!'
                })
            );
            yield put(
                makeParticipantByIdAsync.success({
                    user: data,
                    userId: action.payload.userId
                })
            );
        } else {
            yield put(makeParticipantByIdAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(makeParticipantByIdAsync.failure(err));
    }
}

function closeUserByIdAPI(payload: ICloseUserByIdPayload) {
    return axios.patch(`/users/id/${payload.userId}/close`, payload);
}

function* closeUserById(action: ReturnType<typeof closeUserByIdAsync.request>) {
    try {
        const { status, data }: AxiosResponse<IAVUser> = yield call(
            closeUserByIdAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully held user!'
                })
            );
            yield put(
                closeUserByIdAsync.success({
                    user: data,
                    userId: action.payload.userId
                })
            );
        } else {
            yield put(closeUserByIdAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(closeUserByIdAsync.failure(err));
    }
}

// function getUsersByProcessTypeAPI(
//     type: string,
//     processName: string,
//     fromDate?: string,
//     toDate?: string,
//     tz?: string
// ) {
//     return axios.get(`/users/process/type/${type}`, {
//         params: {
//             processName,
//             fromDate,
//             toDate,
//             tz
//         }
//     });
// }

// function* getUsersByProcessType(
//     action: ReturnType<typeof getUsersByProcessTypeAsync.request>
// ) {
//     try {
//         const {
//             status,
//             data
//         }: AxiosResponse<IAVUserCollectionDTO> = yield call(
//             getUsersByProcessTypeAPI,
//             action.payload.processType,
//             action.payload.processName,
//             action.payload.fromDate,
//             action.payload.toDate,
//             action.payload.tz
//         );
//         if (status === 200) {
//             yield put(
//                 getUsersByProcessTypeAsync.success({
//                     processType: action.payload.processType,
//                     processName: action.payload.processName,
//                     collection: data
//                 })
//             );
//         } else {
//             yield put(getUsersByProcessTypeAsync.failure('Network Error'));
//         }
//     } catch (err) {
//         yield put(getUsersByProcessTypeAsync.failure(err));
//     }
// }

// function completeProcessStepAPI(payload: ICompleteProcessStepPayload) {
//     return axios.patch(`/users/process/complete/${payload.id}`, payload);
// }

// function* completeProcessStep(
//     action: ReturnType<typeof completeProcessStepAsync.request>
// ) {
//     try {
//         const { status, data }: AxiosResponse<IAVUser> = yield call(
//             completeProcessStepAPI,
//             action.payload
//         );
//         if (status === 200) {
//             yield put(
//                 completeProcessStepAsync.success({
//                     id: action.payload.id,
//                     processName: action.payload.processName,
//                     user: data
//                 })
//             );
//         } else {
//             yield put(completeProcessStepAsync.failure('Network Error'));
//         }
//     } catch (err) {
//         yield put(completeProcessStepAsync.failure(err));
//     }
// }

// function rescheduleProcessStepAPI(payload: IRescheduleProcessStepPayload) {
//     return axios.patch(`/users/process/reschedule/${payload.id}`, payload);
// }

// function* rescheduleProcessStep(
//     action: ReturnType<typeof rescheduleProcessStepAsync.request>
// ) {
//     try {
//         const { status, data }: AxiosResponse<IAVUser> = yield call(
//             rescheduleProcessStepAPI,
//             action.payload
//         );
//         if (status === 200) {
//             yield put(
//                 rescheduleProcessStepAsync.success({
//                     id: action.payload.id,
//                     processName: action.payload.processName,
//                     user: data
//                 })
//             );
//         } else {
//             yield put(rescheduleProcessStepAsync.failure('Network Error'));
//         }
//     } catch (err) {
//         yield put(rescheduleProcessStepAsync.failure(err));
//     }
// }

export function* mainSaga() {
    yield all([
        yield takeEvery(getAllUsersAsync.request, getAllUsers),
        yield takeLeading(getUserByIdAsync.request, getUserById),
        yield takeLeading(getAVUserAsync.request, getAVUser),
        yield takeLeading(getUserAsync.request, getUser),
        yield takeEvery(getUserNumberAsync.request, getUserNumber),
        yield takeEvery(updateUserAsync.request, updateUser),
        yield takeEvery(createUserAsync.request, createUser),
        yield takeEvery(deleteUserAsync.request, deleteUser),
        yield takeEvery(makeParticipantByIdAsync.request, makeParticipantById),
        yield takeEvery(closeUserByIdAsync.request, closeUserById)

        // yield takeEvery(
        //     getUsersByProcessTypeAsync.request,
        //     getUsersByProcessType
        // ),

        // yield takeEvery(completeProcessStepAsync.request, completeProcessStep),
        // yield takeEvery(
        //     rescheduleProcessStepAsync.request,
        //     rescheduleProcessStep
        // )
    ]);
}
