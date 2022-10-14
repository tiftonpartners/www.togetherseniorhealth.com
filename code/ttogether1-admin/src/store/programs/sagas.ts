import { call, put, takeEvery, all, takeLeading } from 'redux-saga/effects';
import axios from 'util/Api';
import { AxiosResponse } from 'axios';
import _ from 'lodash';
import {
    getAllProgramsAsync,
    getMyProgramsAsync,
    IGetAllProgramsPayload,
    IGetMyProgramsPayload
} from './actions';
import { IProgram } from 'types/program';
import { snackbarShow } from 'store/ui/snackbar/actions';

function getMyProgramsAPI(payload: IGetMyProgramsPayload) {
    return axios.get('/programs/me', { params: payload });
}

function* getMyPrograms(action: ReturnType<typeof getMyProgramsAsync.request>) {
    try {
        const {
            status,
            data
        }: AxiosResponse<{ programs: IProgram[]; all: boolean }> = yield call(
            getMyProgramsAPI,
            action.payload
        );
        if (status === 200) {
            const byAcronym = data.programs.map(program => program.acronym);
            const programCollection = Object.assign(
                {},
                ...data.programs.map(program => ({
                    [program.acronym]: program
                }))
            );
            yield put(
                getMyProgramsAsync.success({
                    collection: programCollection,
                    byAcronym,
                    all: data.all
                })
            );
        } else {
            yield put(getMyProgramsAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getMyProgramsAsync.failure(err));
    }
}

function getAllProgramsAPI(payload: IGetAllProgramsPayload) {
    return axios.get('/programs/all', { params: payload });
}

function* getAllPrograms(
    action: ReturnType<typeof getAllProgramsAsync.request>
) {
    try {
        const { status, data }: AxiosResponse<IProgram[]> = yield call(
            getAllProgramsAPI,
            action.payload
        );
        if (status === 200) {
            const byAcronym = data.map(program => program.acronym);
            const programCollection = Object.assign(
                {},
                ...data.map(program => ({
                    [program.acronym]: program
                }))
            );
            yield put(
                getAllProgramsAsync.success({
                    collection: programCollection,
                    byAcronym
                })
            );
        } else {
            yield put(getAllProgramsAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getAllProgramsAsync.failure(err));
    }
}

export function* mainSaga() {
    yield all([yield takeLeading(getMyProgramsAsync.request, getMyPrograms)]);
    yield all([yield takeLeading(getAllProgramsAsync.request, getAllPrograms)]);
}
