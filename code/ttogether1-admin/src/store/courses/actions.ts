import { ICourse } from 'types/course';
import { createAsyncAction } from 'typesafe-actions';

export interface IGetAllCoursesPayload {
    program?: string;
}

export interface IGetAllCoursesResponse {
    courses: ICourse[];
}
export const getAllCoursesAsync = createAsyncAction(
    '@@GET_ALL_COURSES_REQUEST',
    '@@GET_ALL_COURSES_SUCCESS',
    '@@GET_ALL_COURSES_ERROR'
)<
    [IGetAllCoursesPayload, undefined],
    [IGetAllCoursesResponse, undefined],
    string
>();

export interface ICreateCoursePayload {
    course: ICourse;
}

export const createCourseAsync = createAsyncAction(
    '@@CREATE_COURSE_REQUEST',
    '@@CREATE_COURSE_SUCCESS',
    '@@CREATE_COURSE_ERROR'
)<
    [ICreateCoursePayload, undefined],
    [ICreateCoursePayload, undefined],
    string
>();

export interface IUpdateCoursePayload {
    acronym: string;
    course: Partial<ICourse>;
}
export const updateCourseAsync = createAsyncAction(
    '@@UPDATE_COURSE_REQUEST',
    '@@UPDATE_COURSE_SUCCESS',
    '@@UPDATE_COURSE_ERROR'
)<[IUpdateCoursePayload, undefined], [ICourse, undefined], string>();
