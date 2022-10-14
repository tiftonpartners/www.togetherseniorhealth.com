import { call, put, takeEvery, all } from 'redux-saga/effects';
import {
    createCourseAsync,
    getAllCoursesAsync,
    IGetAllCoursesPayload,
    updateCourseAsync
} from './actions';
import axios from 'util/Api';
import { AxiosResponse } from 'axios';
import { ICourse } from 'types/course';
import { snackbarShow } from 'store/ui/snackbar/actions';
import _ from 'lodash';

function getAllCoursesAPI(payload: IGetAllCoursesPayload) {
    return axios.get('/courses', { params: payload });
}

function* getAllCourses(action: ReturnType<typeof getAllCoursesAsync.request>) {
    try {
        const { status, data }: AxiosResponse<ICourse[]> = yield call(
            getAllCoursesAPI,
            action.payload
        );
        if (status === 200) {
            yield put(
                getAllCoursesAsync.success({
                    courses: data
                })
            );
        } else {
            yield put(getAllCoursesAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(getAllCoursesAsync.failure(err));
    }
}

function createCourseAPI(data: ICourse) {
    return axios.post(`/courses`, data);
}

function* createCourse(action: ReturnType<typeof createCourseAsync.request>) {
    try {
        const { status, data }: AxiosResponse<ICourse> = yield call(
            createCourseAPI,
            action.payload.course
        );
        if (status === 200) {
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully created course!'
                })
            );
            yield put(
                createCourseAsync.success({
                    course: data
                })
            );
        } else {
            yield put(createCourseAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(createCourseAsync.failure(err));
    }
}

function updateCourseAPI(acronym: string, data: Partial<ICourse>) {
    return axios.patch(`/courses/${acronym}`, data);
}

function* updateCourse(action: ReturnType<typeof updateCourseAsync.request>) {
    try {
        const { status, data }: AxiosResponse<ICourse> = yield call(
            updateCourseAPI,
            action.payload.acronym,
            action.payload.course
        );
        if (status === 200) {
            yield put(
                snackbarShow({
                    type: 'success',
                    message: 'Successfully updated course!'
                })
            );
            yield put(updateCourseAsync.success(data));
        } else {
            yield put(updateCourseAsync.failure('Network Error'));
        }
    } catch (err) {
        yield put(
            snackbarShow({
                type: 'error',
                message: _.get(err, ['response', 'data'])
            })
        );
        yield put(updateCourseAsync.failure(err));
    }
}

export function* mainSaga() {
    yield all([
        yield takeEvery(getAllCoursesAsync.request, getAllCourses),
        yield takeEvery(createCourseAsync.request, createCourse),
        yield takeEvery(updateCourseAsync.request, updateCourse)
    ]);
}
