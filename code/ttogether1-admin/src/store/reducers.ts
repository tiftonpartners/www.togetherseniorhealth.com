import { combineReducers } from 'redux';

import settingsReducer from './settings/reducers';
import commonReducer from './common/reducers';
import globalReducer from './ui/global/reducers';
import classesReducer from './classes/reducers';
import coursesReducer from './courses/reducers';
import auth0UsersReducer from './auth0Users/reducers';
import usersReducer from './users/reducers';
import sessionsReducer from './sessions/reducers';
import snackbarReducer from './ui/snackbar/reducers';
import programReducer from './programs/reducers';
import notificationsReducer from './notifications/reducers';
import recordingsReducer from './recordings/reducers';

const rootReducer = combineReducers({
    settings: settingsReducer,
    common: commonReducer,
    global: globalReducer,
    classes: classesReducer,
    auth0Users: auth0UsersReducer,
    users: usersReducer,
    courses: coursesReducer,
    notifications: notificationsReducer,
    sessions: sessionsReducer,
    snackbar: snackbarReducer,
    recordings: recordingsReducer,
    programs: programReducer
});

export default rootReducer;
