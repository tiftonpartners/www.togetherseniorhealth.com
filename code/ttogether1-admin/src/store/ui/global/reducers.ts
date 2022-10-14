import { createReducer } from 'typesafe-actions';
import { updateClassSelection, updateProgramSelection } from './actions';

export interface IGlobalState {
    selectedProgram: string;
    selectedCourse: string;
    selectedClass: string;
}
export const globalReducer = createReducer({
    selectedProgram: '',
    selectedCourse: '',
    selectedClass: ''
} as IGlobalState)
    .handleAction(updateProgramSelection, (state, action) => {
        return {
            ...state,
            selectedProgram: action.payload
        };
    })
    .handleAction(updateClassSelection, (state, action) => {
        return {
            ...state,
            selectedCourse: action.payload.courseAcronym,
            selectedClass: action.payload.classAcronym
        };
    });

export default globalReducer;
export type GlobalState = ReturnType<typeof globalReducer>;
