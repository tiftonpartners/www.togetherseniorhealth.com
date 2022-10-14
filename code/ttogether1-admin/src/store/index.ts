import { applyMiddleware, createStore, Middleware, StoreEnhancer } from 'redux';
import { createWrapper, MakeStore } from 'next-redux-wrapper';
import createSagaMiddleware from 'redux-saga';
import { RootState } from 'typesafe-actions';

import rootReducer from './reducers';
import rootSaga from './sagas';

const bindMiddleware = (middleware: Middleware[]): StoreEnhancer => {
	if (process.env.NODE_ENV !== 'production') {
		const { composeWithDevTools } = require('redux-devtools-extension');
		return composeWithDevTools(applyMiddleware(...middleware));
	}
	return applyMiddleware(...middleware);
};

export const makeStore: MakeStore<RootState> = () => {
	const sagaMiddleware = createSagaMiddleware();

	const store = createStore(rootReducer, bindMiddleware([sagaMiddleware]));

	store.sagaTask = sagaMiddleware.run(rootSaga);

	return store;
};

export const wrapper = createWrapper<RootState>(makeStore, { debug: true });
