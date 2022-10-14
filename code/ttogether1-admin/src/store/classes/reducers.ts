import { combineReducers } from 'redux';
import { IClass, IClassCollectionDTO } from 'types/class';
import { createReducer } from 'typesafe-actions';
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
    removeUserFromClassByIdAsync,
    scheduleSessionsForClassAsync,
    skipSessionAsync,
    updateClassAsync,
    updateSessionAsync
} from './actions';
import update from 'immutability-helper';
import _ from 'lodash';

export const creating = createReducer(false as boolean)
    .handleAction([createClassAsync.request], () => true)
    .handleAction(
        [createClassAsync.success, createClassAsync.failure],
        () => false
    );

export const loading = createReducer(true as boolean)
    .handleAction(
        [
            getClassesForMeAsync.request,
            createClassAsync.request,
            getClassesByCourseAcronymAsync.request
        ],
        () => true
    )
    .handleAction(
        [
            getClassesForMeAsync.success,
            getClassesForMeAsync.failure,
            createClassAsync.success,
            createClassAsync.failure,
            getClassesByCourseAcronymAsync.success,
            getClassesByCourseAcronymAsync.failure
        ],
        () => false
    );

export const me = createReducer([] as IClass[]).handleAction(
    getClassesForMeAsync.success,
    (state, action) => {
        return action.payload;
    }
);

export const collection = createReducer({} as IClassCollectionDTO)
    .handleAction(
        [
            getClassesByCourseAcronymAsync.success,
            getClassesByUserIdAsync.success
        ],
        (state, action) => {
            let classes = action.payload.classes.reduce((map, obj) => {
                if (state.hasOwnProperty(obj._id)) {
                    map[obj._id] = { $merge: obj };
                } else {
                    map[obj._id] = { $set: obj };
                }

                return map;
            }, {} as { [classId: string]: any });

            return update(state, classes);
        }
    )
    .handleAction(getClassByIdAsync.success, (state, action) => {
        let classId = action.payload._id;
        if (state.hasOwnProperty(classId)) {
            return update(state, {
                [classId]: { $merge: action.payload }
            });
        } else {
            return update(state, {
                [classId]: { $set: action.payload }
            });
        }
    })
    .handleAction(deleteClassByIdAsync.success, (state, action) => {
        let classId = action.payload.classId;
        return update(state, { $unset: [classId] });
    })
    .handleAction(
        [
            createClassAsync.success,
            assignUserToClassByIdAsync.success,
            removeUserFromClassByIdAsync.success
        ],
        (state, action) => {
            let classId = action.payload.class._id;

            if (state.hasOwnProperty(classId)) {
                return update(state, {
                    [classId]: { $merge: action.payload.class }
                });
            } else {
                return update(state, {
                    [classId]: { $set: action.payload.class }
                });
            }
        }
    )
    .handleAction(
        [updateClassAsync.success, scheduleSessionsForClassAsync.success],
        (state, action) => {
            let classId = action.payload.class._id;
            return update(state, {
                [classId]: { $merge: action.payload.class }
            });
        }
    )
    .handleAction(
        [
            updateSessionAsync.success,
            skipSessionAsync.success,
            deleteSessionAsync.success
        ],
        (state, action) => {
            let classId = action.payload.class._id;
            return update(state, {
                [classId]: {
                    sessions: {
                        $set: action.payload.class.sessions
                    },
                    numSessions: {
                        $set: action.payload.class.numSessions
                    }
                }
            });
        }
    );

export const order = createReducer([] as string[])
    .handleAction(
        [
            getClassesByCourseAcronymAsync.success,
            getClassesByUserIdAsync.success
        ],
        (state, action) => {
            return [...action.payload.classes.map(klass => klass._id)];
        }
    )
    .handleAction(
        [createClassAsync.success, assignUserToClassByIdAsync.success],
        (state, action) => {
            return [...state, action.payload.class._id];
        }
    )
    .handleAction(removeUserFromClassByIdAsync.success, (state, action) => {
        const index = state.indexOf(action.payload.class._id);
        return index > -1 ? update(state, { $splice: [[index, 1]] }) : state;
    })
    .handleAction(deleteClassByIdAsync.success, (state, action) => {
        const index = state.indexOf(action.payload.classId);
        return index > -1 ? update(state, { $splice: [[index, 1]] }) : state;
    });

export const byCourse = createReducer(
    {} as { [courseAcronym: string]: string[] }
).handleAction(
    [
        getClassesByCourseAcronymAsync.success,
        createClassAsync.success,
        deleteClassByIdAsync.success
    ],
    (state, action) => {
        let courseAcronym = action.payload.courseAcronym;
        return {
            ...state,
            [courseAcronym]: order(state[courseAcronym], action)
        };
    }
);

export const byUserId = createReducer({} as { [userId: string]: string[] })
    .handleAction([getClassesByUserIdAsync.success], (state, action) => {
        let userId = action.payload.userId;
        return update(state, {
            [userId]: { $set: order(state[userId] || [], action) }
        });
    })

    .handleAction(
        [
            assignUserToClassByIdAsync.success,
            removeUserFromClassByIdAsync.success
        ],
        (state, action) => {
            if (!action.payload.user) return state;
            const userId = action.payload.user.userId;
            return {
                ...state,
                [userId]: order(state[userId] || [], action)
            };
        }
    )
    .handleAction([deleteClassByIdAsync.success], (state, action) => {
        let obj = {};

        // loop all user ids and check for deleted class
        for (const key in state) {
            obj[key] = order(state[key], action);
        }
        return obj;
    });

export const crossProgram = createReducer(false as boolean).handleAction(
    [crossProgramConfirmToggle],
    (state, action) => {
        return !state;
    }
);

const reducer = combineReducers({
    loading,
    creating,
    me,
    collection,
    byCourse,
    byUserId,
    crossProgram
});

export default reducer;
export type ClassesState = ReturnType<typeof reducer>;
