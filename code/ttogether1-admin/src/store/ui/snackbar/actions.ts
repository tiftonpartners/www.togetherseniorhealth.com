import { createAction } from 'typesafe-actions';

export interface ISnackbarShow {
    type: 'success' | 'error' | 'info';
    message: string;
}

export const snackbarShow = createAction('@@SNACKBAR_SHOW')<ISnackbarShow>();

export const snackbarClear = createAction('@@SNACKBAR_CLEAR')();
