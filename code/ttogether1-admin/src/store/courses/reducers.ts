import { combineReducers } from 'redux';
import { ICourse } from 'types/course';
import { createReducer } from 'typesafe-actions';
import {
    createCourseAsync,
    getAllCoursesAsync,
    updateCourseAsync
} from './actions';

export const loading = createReducer(false as boolean)
    .handleAction(
        [getAllCoursesAsync.request, createCourseAsync.request],
        () => true
    )
    .handleAction(
        [
            getAllCoursesAsync.success,
            getAllCoursesAsync.failure,
            createCourseAsync.success,
            createCourseAsync.failure
        ],
        () => false
    );

export const collection = createReducer([] as ICourse[])
    .handleAction(getAllCoursesAsync.success, (state, action) => {
        const courses = action.payload.courses.map(course => {
            let date = new Date(course.createdOn);
            return {
                ...course,
                displayCreatedOn: date.toUTCString()
            };
        });
        return courses;
    })
    .handleAction(createCourseAsync.success, (state, action) => {
        let date = new Date(action.payload.course.createdOn);
        return [
            ...state,
            { ...action.payload.course, displayCreatedOn: date.toUTCString() }
        ];
    })
    .handleAction(updateCourseAsync.success, (state, action) => {
        let index = state.findIndex(
            course => (course.acronym = action.payload.acronym)
        );
        if (index > -1) {
            return state.map(course => {
                let date = new Date(course.createdOn);
                return course.acronym === action.payload.acronym
                    ? {
                          ...course,
                          ...action.payload,
                          displayCreatedOn: date.toUTCString()
                      }
                    : course;
            });
        }
        return [...state, action.payload];
    });

const reducer = combineReducers({
    loading,
    collection
});

export default reducer;
export type CoursesState = ReturnType<typeof reducer>;
