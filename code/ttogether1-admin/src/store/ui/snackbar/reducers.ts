import { createReducer } from 'typesafe-actions';
import { snackbarShow, snackbarClear, ISnackbarShow } from './actions';

export interface ISnackbarState extends ISnackbarShow {
    visible: boolean;
}
export const snackbarReducer = createReducer({} as ISnackbarState)
    .handleAction(snackbarShow, (state, action) => {
        return {
            ...state,
            ...action.payload,
            visible: true
        };
    })
    .handleAction(snackbarClear, (state, action) => {
        return {
            ...state,
            message: '',
            visible: false
        };
    });

export default snackbarReducer;
export type SnackbarState = ReturnType<typeof snackbarReducer>;
