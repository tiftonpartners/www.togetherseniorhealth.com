import * as settingsActions from './settings/actions';
import * as commonActions from './common/actions';
import * as globalActions from './ui/global/actions';
import * as classesActions from './classes/actions';
import * as coursesActions from './courses/actions';
import * as auth0UsersActions from './auth0Users/actions';
import * as usersActions from './users/actions';
import * as sessionsActions from './sessions/actions';
import * as snackbarActions from './ui/snackbar/actions';
import * as notificationsActions from './notifications/actions';
import * as programsActions from './programs/actions';
import * as recordingsActions from './recordings/actions';

export default {
    settings: settingsActions,
    common: commonActions,
    global: globalActions,
    classes: classesActions,
    courses: coursesActions,
    auth0Users: auth0UsersActions,
    users: usersActions,
    sessions: sessionsActions,
    snackbar: snackbarActions,
    notifications: notificationsActions,
    programs: programsActions,
    recordings: recordingsActions
};
