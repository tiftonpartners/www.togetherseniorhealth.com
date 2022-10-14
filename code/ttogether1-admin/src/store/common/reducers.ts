import { createReducer } from 'typesafe-actions';
import { fetchStart, fetchError, fetchSuccess, showMessage, hideMessage } from './actions';

const INIT_STATE = {
	error: '',
	loading: false,
	navCollapsed: false,
	message: ''
};

export const reducer = createReducer(INIT_STATE)
	.handleAction(fetchStart, (state, action) => {
		return {
			...state,
			error: '',
			message: '',
			loading: true
		};
	})
	.handleAction(fetchSuccess, (state, action) => {
		return {
			...state,
			error: '',
			message: '',
			loading: false
		};
	})
	.handleAction(fetchError, (state, action) => {
		return {
			...state,
			loading: false,
			error: action.payload,
			message: ''
		};
	})
	.handleAction(showMessage, (state, action) => {
		return {
			...state,
			error: '',
			message: action.payload,
			loading: false
		};
	})
	.handleAction(hideMessage, (state, action) => {
		return {
			...state,
			loading: false,
			error: '',
			message: ''
		};
	});

export default reducer;
export type CommonState = ReturnType<typeof reducer>;
