require('dotenv').config();
import { Logger } from '../core/logger.service';
import { SessionState, SessionStateService } from './session-state.service';

const log = Logger.logger('SocketsService');

/**
 * The Sockets service mediates between sockets and a session state
 * As events come in on the socket, the session state is updated to
 * reflect the events.  Likewise, side effects of changes to session
 * states are commumicated to the socket service, which communicates
 * the changes via events to interested sockets
 */

export class SocketsService {}
