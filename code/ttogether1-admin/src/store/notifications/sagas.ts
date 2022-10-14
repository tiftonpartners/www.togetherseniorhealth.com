import { call, put, takeEvery, all } from 'redux-saga/effects';
import {
    getAllLedgerEntriesAsync,
    ISendAdHocSessionReminderEmailByUserIdPayload,
    ISendClassReminderEmailByUserIdPayload,
    sendAdHocSessionReminderEmailByUserIdAsync,
    sendClassReminderEmailByUserIdAsync
} from './actions';
import axios from 'util/Api';
import { AxiosResponse } from 'axios';
import { snackbarShow } from 'store/ui/snackbar/actions';
import _ from 'lodash';
import {
    EmailStatus,
    IEmailLedger,
    IEmailLedgerCollectionDTO
} from 'types/notification';
import moment from 'moment-timezone';

function sendClassReminderEmailByUserIdAPI(
    payload: ISendClassReminderEmailByUserIdPayload
) {
    return axios.get('/notifications/email/userClassReminder', {
        params: payload
    });
}

function* sendClassReminderEmailByUserId(
    action: ReturnType<typeof sendClassReminderEmailByUserIdAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<boolean> = yield call(
            sendClassReminderEmailByUserIdAPI,
            action.payload
        );

        if (status === 200) {
            yield put(
                sendClassReminderEmailByUserIdAsync.success({
                    emailSent: data,
                    classAcronym: action.payload.classAcronym,
                    userId: action.payload.userId
                })
            );

            yield put(
                snackbarShow({
                    type: 'success',
                    message: `Successfully sent class reminder for class acronym: ${action.payload.classAcronym}`
                })
            );
        } else {
            yield put(
                sendClassReminderEmailByUserIdAsync.failure('Network Error')
            );
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(sendClassReminderEmailByUserIdAsync.failure(err));
    }
}

function sendadHocSessionReminderEmailByUserIdAPI(
    payload: ISendAdHocSessionReminderEmailByUserIdPayload
) {
    return axios.get('/notifications/email/userAdHocSessionReminder', {
        params: payload
    });
}

function* sendAdHocSessionReminderEmailByUserId(
    action: ReturnType<
        typeof sendAdHocSessionReminderEmailByUserIdAsync.request
    >
) {
    try {
        const { status, data }: AxiosResponse<boolean> = yield call(
            sendadHocSessionReminderEmailByUserIdAPI,
            action.payload
        );

        if (status === 200) {
            yield put(
                sendAdHocSessionReminderEmailByUserIdAsync.success({
                    emailSent: data,
                    sessionAcronym: action.payload.sessionAcronym,
                    userId: action.payload.userId
                })
            );

            yield put(
                snackbarShow({
                    type: 'success',
                    message: `Successfully sent ad hoc session reminder for session acronym: ${action.payload.sessionAcronym}`
                })
            );
        } else {
            yield put(
                sendAdHocSessionReminderEmailByUserIdAsync.failure(
                    'Network Error'
                )
            );
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(sendAdHocSessionReminderEmailByUserIdAsync.failure(err));
    }
}

function getAllLedgerEntriesAPI() {
    return axios.get('/notifications/ledger');
}

function* getAllLedgerEntries(
    action: ReturnType<typeof getAllLedgerEntriesAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<IEmailLedger[]> = yield call(
            getAllLedgerEntriesAPI
        );
        if (status === 200) {
            const entryCollection: IEmailLedgerCollectionDTO = {};

            let dates = [];

            data.map(entry => {
                if (_.has(entryCollection, entry.batchId)) {
                    const batch = entryCollection[entry.batchId];
                    entryCollection[entry.batchId] = {
                        ...batch,
                        entries: [...batch.entries, entry],
                        to: [...batch.to, entry.to],
                        emailsRejected:
                            entry.status === EmailStatus.Rejected
                                ? batch.emailsRejected + 1
                                : batch.emailsRejected,
                        emailsSent:
                            entry.status === EmailStatus.Sent
                                ? batch.emailsSent + 1
                                : batch.emailsSent
                    };
                } else {
                    entryCollection[entry.batchId] = {
                        entries: [entry],
                        to: [entry.to],
                        batchId: entry.batchId,
                        createdOn: entry.createdOn,
                        emailType: entry.emailType,
                        emailsRejected:
                            entry.status === EmailStatus.Rejected ? 1 : 0,
                        emailsSent: entry.status === EmailStatus.Sent ? 1 : 0
                    };

                    // all in batch should have same created on, so just pull first
                    dates.push({
                        batchId: entry.batchId,
                        date: entry.createdOn
                    });
                }
            });
            const byDate: string[] = dates
                .sort((a, b) => (moment(a.date).isBefore(b.date) ? 1 : -1))
                .map(entry => entry.batchId);

            yield put(
                getAllLedgerEntriesAsync.success({
                    collection: entryCollection,
                    byDate
                })
            );
        } else {
            yield put(getAllLedgerEntriesAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getAllLedgerEntriesAsync.failure(err));
    }
}

export function* mainSaga() {
    yield all([
        yield takeEvery(
            sendClassReminderEmailByUserIdAsync.request,
            sendClassReminderEmailByUserId
        ),
        yield takeEvery(
            sendAdHocSessionReminderEmailByUserIdAsync.request,
            sendAdHocSessionReminderEmailByUserId
        ),
        yield takeEvery(getAllLedgerEntriesAsync.request, getAllLedgerEntries)
    ]);
}
