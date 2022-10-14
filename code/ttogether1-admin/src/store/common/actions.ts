import { createAction } from 'typesafe-actions';
import { FETCH_ERROR, FETCH_START, FETCH_SUCCESS, HIDE_MESSAGE, SHOW_MESSAGE } from '../../constants/ActionTypes';

export const fetchStart = createAction(FETCH_START)();
export const fetchSuccess = createAction(FETCH_SUCCESS)();
export const fetchError = createAction(FETCH_ERROR)<string>();
export const showMessage = createAction(SHOW_MESSAGE)<string>();
export const hideMessage = createAction(HIDE_MESSAGE)();
