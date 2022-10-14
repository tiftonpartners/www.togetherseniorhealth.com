import { call, put, takeEvery, all } from 'redux-saga/effects';
import {
    getAllRecordingsAsync,
    getClassRecordingsByAcronymAsync,
    getClassRecordingsBySIDAsync,
    IGetAllRecordingsPayload,
    IGetClassRecordingsByAcronymPayload,
    IGetClassRecordingsBySIDPayload
} from './actions';
import axios from 'util/Api';
import { AxiosResponse } from 'axios';
import _ from 'lodash';
import { IRecording, IRecordingFile } from 'types/recording';
import { snackbarShow } from 'store/ui/snackbar/actions';

function getAllRecordingsAPI() {
    return axios.get(`video/agora/recordings/get/all`);
}

function* getAllRecordings(
    action: ReturnType<typeof getAllRecordingsAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<IRecording[]> = yield call(
            getAllRecordingsAPI
        );
        if (status === 200) {
            yield put(
                getAllRecordingsAsync.success({
                    recordings: data
                })
            );
        } else {
            yield put(getAllRecordingsAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getAllRecordingsAsync.failure(err));
    }
}

function getClassRecordingsByAcronymAPI(
    payload: IGetClassRecordingsByAcronymPayload
) {
    return axios.get(
        `/video/agora/recording-files/get/acronym/${payload.acronym}`
    );
}

function* getClassRecordingsByAcronym(
    action: ReturnType<typeof getClassRecordingsByAcronymAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<IRecordingFile[]> = yield call(
            getClassRecordingsByAcronymAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                getClassRecordingsByAcronymAsync.success({
                    recordings: data,
                    acronym: action.payload.acronym
                })
            );
        } else {
            yield put(
                getClassRecordingsByAcronymAsync.failure('Network Error')
            );
        }
    } catch (err) {
        yield put(getClassRecordingsByAcronymAsync.failure(err));
    }
}

function getClassRecordingsBySIDAPI(payload: IGetClassRecordingsBySIDPayload) {
    return axios.get(`/video/agora/recording-files/get/sid/${payload.sid}`);
}

function* getClassRecordingsBySID(
    action: ReturnType<typeof getClassRecordingsBySIDAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<IRecordingFile> = yield call(
            getClassRecordingsBySIDAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                getClassRecordingsBySIDAsync.success({
                    recordings: [data],
                    sid: action.payload.sid
                })
            );
        } else {
            yield put(getClassRecordingsBySIDAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getClassRecordingsBySIDAsync.failure(err));
    }
}

export function* mainSaga() {
    yield all([
        yield takeEvery(getAllRecordingsAsync.request, getAllRecordings),
        yield takeEvery(
            getClassRecordingsByAcronymAsync.request,
            getClassRecordingsByAcronym
        ),
        yield takeEvery(
            getClassRecordingsBySIDAsync.request,
            getClassRecordingsBySID
        )
    ]);
}
