import { all, fork } from 'redux-saga/effects';
import { mainSaga as classesSaga } from './classes/sagas';
import { mainSaga as coursesSaga } from './courses/sagas';
import { mainSaga as auth0UsersSaga } from './auth0Users/sagas';
import { mainSaga as usersSaga } from './users/sagas';
import { mainSaga as sessionsSaga } from './sessions/sagas';
import { mainSaga as notificationsSaga } from './notifications/sagas';
import { mainSaga as programsSaga } from './programs/sagas';
import { mainSaga as recordingsSaga } from './recordings/sagas';

const rootSaga = function* root(): Generator {
    yield all([
        fork(classesSaga),
        fork(coursesSaga),
        fork(auth0UsersSaga),
        fork(usersSaga),
        fork(sessionsSaga),
        fork(notificationsSaga),
        fork(programsSaga),
        fork(recordingsSaga)
    ]);
};

export default rootSaga;
