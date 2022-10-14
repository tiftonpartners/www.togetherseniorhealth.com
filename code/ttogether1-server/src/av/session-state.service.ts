/**
 * Service and types to manage cached information about active sessions
 */

import { Socket } from 'socket.io';
import { Logger } from '../core/logger.service';
import { ClassService } from '../service/class.service';
import SessionType, { ClassSession, GenericSession } from '../db/session.db';
import { AdHocSessionService } from '../service/adhoc-session.service';
import { AgoraRecordingService } from './agora-recording.service';
import { MutexObject } from '../core/mutex';
import {
    RecordingModel,
    RecordingState as RecordingStatus,
} from '../db/recording.db';
import { GaTelemetry } from '../core/ga_telemetry';
import { RedisService } from '../core/redis.service';
import { SocketIoService } from '../core/socket_io.service';

require('dotenv').config();

let moment = require('moment-timezone');

const log = Logger.logger('SessionStateService');

/**
 * The view mode that the session is in, copied from client code
 */
export const enum EClientView {
    FOCUS = 'inst',
    GROUP = 'group',
    SPOTLIGHT = 'spot',
}

/**
 * These are the GlobalEvent event types, classes and interface - only the ones that we need, for the moment
 */
export enum EventType {
    SessionJoined = 'SJ',
    SessionLeft = 'SL',
    ViewChanged = 'VC',
    ChangeView = 'CV',
    ChangeViewAll = 'CVA',
    Recording = 'RE',
    HelpWanted = 'HW',
    SetHelpMessage = 'SH',
    QosAlert = 'QOS',
    None = 'X',
    Unknown = '?',
    Heartbeat = 'HB',
    HeartbeatReply = 'HR',
}

export enum EventClass {
    Notify = 'N',
    Command = 'C',
    None = 'X',
    UNKNOWN = '?',
}

export const NO_SUBJECT = '-';
export const NO_SESSION = '-';
export const NO_TARGET = '';
export const NO_STREAM = '-';
export const ANY_SUBJECT = '*';
export const SERVER_SUBJECT = '$';
export const ANY_SESSION = '*';
export const ANY_TARGET = '*';
export const GROUP_VIEW = 'group';
export const INSTUCTOR_VIEW = 'inst';

export class GlobalEvent {
    subject: string = ANY_SUBJECT; // Who this is for/about, '*' indicates everybody in the session, '-' indicates nobody
    sessionId: string = ANY_SUBJECT; // Session Id, '*' indicates all sessions, '-' indicates no session
    target: any; // Command specific data, usually a string except for login

    constructor(public eventClass: EventClass, public event: EventType) {}
}

export enum RecordingState {
    ON = 'on',
    OFF = 'off',
    ERROR = 'err',
    PAUSED = 'pause',
}

const SESSION_STATE_EXPIRES_HRS = 1;

/**
 * Object to cache information about a session and its current state
 * The current state is used to setup newly joined participants to
 * match the current state and to manage any events around the lifecycle
 * of a session, including recording
 */
export class SessionState extends MutexObject {
    attendees: string[] = []; // List of attendees that have connected, but are not necessarily active
    activeUsers: string[] = []; // List of current active users
    acronym: string = ''; // Its acronym
    sessionType: SessionType = SessionType.GenericSession;
    recordingState: RecordingState = RecordingState.OFF; // Currently recording?
    customHelpMessage = 'The instructor has been notified that you need help';
    recordingSid: string = ''; // SID for Agora recording resource, if recording
    created: Date; // When was the session object created? (adjusted for timeOffset)
    createdActual: Date; // What was the system time when created? (same as created, excepted when testing)
    firstActive: Date | undefined; // When was the session first joined?
    lastActive: Date | undefined; // Time the last user left the session
    currentView: EClientView = EClientView.GROUP; // Current view, defaults to Group
    spotlightUser: string | undefined; // UserId of using being spotlighted, if any
    scheduledStartTime: Date;
    scheduledEndTime: Date;
    lobbyOpenTime: Date;
    lobbyCloseTime: Date;
    expires: Date;
    tz: string;
    timeOffset: number = 0; // Add this time to the current time to get effective time (for testing)
    providerId: string;
    instructorId: string;

    // extras
    classId: string = '';
    className: string = '';

    // Construct a session state record
    //
    // @param now (moment) Set the current date/time for the session.  This calculates
    // a time offset to the session which is added to the current time when
    // time calculations are done for the session.
    constructor(session: GenericSession | undefined) {
        super();
        this.acronym = session?.acronym ?? '';
        this.sessionType = session?.__t ?? SessionType.GenericSession;
        this.lobbyOpenTime = session?.lobbyOpenTime ?? new Date(0);
        this.lobbyCloseTime = session?.lobbyCloseTime ?? new Date(0);
        this.scheduledStartTime = session?.scheduledStartTime ?? new Date(0);
        this.scheduledEndTime = session?.scheduledEndTime ?? new Date(0);
        this.expires =
            session === undefined
                ? new Date(0)
                : moment(session.scheduledEndTime)
                      .add(SESSION_STATE_EXPIRES_HRS, 'hour')
                      .toDate();
        // this.classId = session.classId
        this.created = new Date();
        this.createdActual = this.created;
        this.tz = session?.tz ?? '';
        this.timeOffset = 0;
        this.customHelpMessage = session?.helpMessage ?? '';
        this.providerId = session?.providerId ?? '';
        this.instructorId = session?.instructorId ?? '';

        this.classId = (session as ClassSession)?.classId ?? '';
        if (this.classId !== '') {
            ClassService.getClassById(this.classId).then((d) => {
                this.className = d?.name ?? '';
            });
        }
    }

    static async fromRedisByAcronym(
        acronym: string
    ): Promise<SessionState | undefined> {
        let deserialized = await RedisService._().get(`tog_sess.${acronym}`);
        return deserialized === undefined
            ? undefined
            : Object.assign(new SessionState(undefined), deserialized);
    }

    public async saveToRedis() {
        if (RedisService._().isAvailable()) {
            await RedisService._().put(`tog_sess.${this.acronym}`, this);
        }
    }

    delFromRedis() {
        if (RedisService._().isAvailable()) {
            RedisService._().del(`tog_sess.${this.acronym}`).then();
        }
    }

    /**
     * Set the current effective time offset for the session.  This stores a time
     * offset which is added the system time to calculate the effective time
     * going forward.  The effective time will be used to determine the open and
     * in-session states, as well as the created time based on the effective time offset.
     *
     * @param now (moment) The new current effective time, or null to make the effective
     * time track system time
     */
    setEffectiveTime(now?: any) {
        if (!now) {
            this.timeOffset = 0;
            this.created = this.createdActual;
        } else {
            this.timeOffset = now.valueOf() - Date.now();
            this.created = moment(this.createdActual)
                .add(this.timeOffset, 'ms')
                .toDate();
        }
    }

    /**
     * Get the current effect time (current system time plus time offset of the session)
     */
    getEffectiveTime(): Date {
        return moment().add(this.timeOffset, 'ms').toDate();
    }

    /**
     * Has the user ever attended this session?
     * @param userId Id of the user
     */
    userHasAttended(userId: string): boolean {
        return this.attendees.includes(userId);
    }

    /**
     * Is the user currently active in the session?
     * @param userId Id of the user
     */
    userIsActive(userId: string): boolean {
        return this.activeUsers.includes(userId);
    }

    /**
     * Add the user as currently active
     * @param userId Id of the user
     */
    addUser(userId: string) {
        if (!userId || userId.length === 0) {
            log.error(
                `Attempting to add null/empty userId to Session ${this.acronym}`
            );
            return;
        }
        if (!this.isActive() && !this.firstActive) {
            this.firstActive = this.getEffectiveTime();
        }
        if (!this.userHasAttended(userId)) {
            this.attendees.push(userId);
        }
        if (!this.userIsActive(userId)) {
            this.activeUsers.push(userId);
        }
    }

    /**
     * Note that the user is no longer currently active
     * @param userId Id of the user
     */
    removeUser(userId: string) {
        this.activeUsers = this.activeUsers.filter((uid) => uid !== userId);
        if (!this.isActive()) {
            this.lastActive = this.getEffectiveTime();
        }
    }

    /**
     * Is the session currently open?
     * @returns true if the lobby is open
     */
    isOpen(): boolean {
        const d = this.getEffectiveTime();
        // @ts-ignore
        return d >= this.lobbyOpenTime && d <= this.lobbyCloseTime;
    }

    /**
     * Is the session currently open?
     * @returns true if the lobby is open
     */
    isAfterClose(): boolean {
        const d = this.getEffectiveTime();
        // @ts-ignore
        return d > this.lobbyCloseTime;
    }

    /**
     * Is the session currently open?
     * @returns true if the lobby is open
     */
    isExpired(): boolean {
        // fixme
        return false;

        // const d = this.getEffectiveTime();
        // @ts-ignore
        // return d > this.expires;
    }

    /**
     * Is the session currently in Session (teaching has started)?
     * @returns true if the lobby is open
     */
    isInSession(): boolean {
        const d = this.getEffectiveTime();
        // @ts-ignore
        return d >= this.scheduledStartTime && d <= this.scheduledEndTime;
    }

    /**
     * Does the session currently have active users?
     * @returns true if the lobby is open
     */
    isActive(): boolean {
        return this.activeUsers.length > 0;
    }

    /**
     * Are we currently recording?
     * @returns True if we are recording
     */
    isRecording(): boolean {
        return this.recordingState === RecordingState.ON;
    }

    /**
     * Change the current view of a session
     *
     * @param target: Target string from global event object
     */
    setViewFromTarget(target: string) {
        this.currentView = EClientView.GROUP; // If all else fails!
        this.spotlightUser = undefined;
        switch (target) {
            case EClientView.GROUP:
                this.currentView = EClientView.GROUP;
                break;
            case EClientView.FOCUS:
                this.currentView = EClientView.FOCUS;
                break;
            default:
                if (target.startsWith('spot:')) {
                    this.currentView = EClientView.SPOTLIGHT;
                    this.spotlightUser = target.substr(5);
                }
        }
    }
}

/**
 * This service remembers information about active sessions and their states.
 * It also generates GlobalEvents that describe changes made to the session
 * such as view changes and users joining the session.
 *
 * It also triggers automatic recording when the first person joins the session
 */
export class SessionStateService {
    private static sessionsByAcronym: any = {}; // SessionStates indexed by their acronym
    static allSessions: SessionState[] = []; // All sessions
    static serviceMutex = new MutexObject();
    static telemetry: GaTelemetry;
    static socketIoService: SocketIoService;

    static async injectDependencies(
        socketIoService: SocketIoService,
        telemetry: GaTelemetry
    ) {
        SessionStateService.telemetry = telemetry;
        SessionStateService.socketIoService = socketIoService;
    }

    /**
     * Reset current state - forgets all active session states
     */
    static reset() {
        SessionStateService.sessionsByAcronym = {}; // SessionStates indexed by their acronym
        SessionStateService.allSessions = []; // All sessions
    }

    /**
     * Handler of socket events
     * @param socket - client socket
     * @param eventIn - protocol event
     */
    static async onSocketEvent(socket: Socket, eventIn: GlobalEvent) {
        let doForward = true;
        const sessionId = eventIn.sessionId;
        const sessionState = await SessionStateService.getSession(sessionId);
        if (!sessionState) {
            // @ts-ignore
            if (eventIn.event != 'LI' && eventIn.event != 'LO') {
                // Events without a session ID (except login events) could be a problem
                log.warn(
                    `message is missing valid event: ${JSON.stringify(eventIn)}`
                );
            }
            return;
        }

        // dimensions for Google Analytics
        const ga_dims = {
            session_id: sessionId,
            session_acronym: sessionState.acronym,
            class_id: sessionState.classId,
            class_name: sessionState.className,
            provider_id: sessionState.providerId,
            instructor_id: sessionState.instructorId,
        };

        // A user has left a session
        if (
            eventIn.eventClass === EventClass.Notify &&
            eventIn.event === EventType.SessionLeft
        ) {
            // Left a session, have the socket leave the corresponding room
            log.info(
                `(socket, id:${socket.id}) User: ${eventIn.subject} is LEAVING session "${sessionId}"`
            );
            sessionState.removeUser(eventIn.subject);
            socket.leave(sessionId);
            await SessionStateService.telemetry.publishEvent({
                name: 'be_session_participants',
                params: {
                    ...ga_dims,
                    event_value: sessionState.attendees.length,
                },
            });
        }

        // A user joined a Session.
        if (
            eventIn.eventClass === EventClass.Notify &&
            eventIn.event === EventType.SessionJoined
        ) {
            log.info(
                `(socket, id:${socket.id}), User ${eventIn.subject} is JOINING session "${sessionId}"`
            );
            // The user's socket joins the socket-session room
            socket.join(sessionId);

            sessionState.addUser(eventIn.subject);
            await SessionStateService.telemetry.publishEvent({
                name: 'be_session_participants',
                params: {
                    ...ga_dims,
                    event_value: sessionState.attendees.length,
                },
            });

            if (eventIn.target?.forceTime?.length > 0) {
                const forceTime: string = eventIn.target.forceTime;
                log.debug(
                    `(socket, id:${socket.id}), Forcing time to: ${forceTime}`
                );
                let effectiveTime: any;

                if (
                    forceTime &&
                    forceTime.match(
                        /(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})\.(\d{3})Z/
                    )
                ) {
                    log.debug(
                        `Forcing time on session:${sessionId} to "${eventIn.target.forceTime}"`
                    );
                    effectiveTime = moment(forceTime);
                    sessionState.setEffectiveTime(effectiveTime);
                } else {
                    log.info(
                        `WARNING: Ignoring effective time on session:"${forceTime}"`
                    );
                }
            }

            // Start recording when a person joins, but only if we are not paused
            // and the session type is class session
            if (
                sessionState.recordingState === RecordingState.OFF &&
                sessionState.sessionType === SessionType.ClassSession
            ) {
                if (sessionState.isOpen()) {
                    await SessionStateService.telemetry.publishEvent({
                        name: 'be_socket_message_record_on',
                        params: { ...ga_dims, event_value: 1 },
                    });

                    // Make sure we are recording.  Consider adding try/finally
                    await SessionStateService.setSessionRecordingState(
                        sessionState,
                        RecordingState.ON
                    );
                } else {
                    log.warn(`Session ${sessionId} is not open, not recording`);
                }
            }

            // Send command to set view and update recording status
            let events = SessionStateService.getCurrentStateEvents(
                sessionState,
                eventIn.subject
            );
            await sessionState.saveToRedis();

            log.info(`Session ${sessionId} current State Events: ${events}`);
            for (const evt of events) {
                if (evt.eventClass === EventClass.Command) {
                    log.debug(
                        `(evt) OUTBOUND to socket: ${JSON.stringify(evt)}`
                    );
                    socket.emit('message', evt);
                }
                if (evt.eventClass === EventClass.Notify) {
                    log.debug(
                        `(evt) OUTBOUND to session ${sessionId}, event: ${JSON.stringify(
                            evt
                        )}`
                    );
                    socket.to(sessionId).emit('message', evt);
                }
            }
            doForward = false;
        }

        // QosAlert for a user
        if (
            eventIn.eventClass === EventClass.Notify &&
            eventIn.event === EventType.QosAlert
        ) {
            log.info(
                `(socket, id:${socket.id}), user ${eventIn.subject} QosAlert "${eventIn.target}" session:${sessionId}`
            );
        }

        // Command to change everybody's view
        // The current view of the session state is updated
        if (
            eventIn.eventClass === EventClass.Command &&
            eventIn.event === EventType.ChangeViewAll
        ) {
            log.info(
                `(socket, id:${socket.id}), user ${eventIn.subject} ChangeViewAll Command, view: "${eventIn.target}" session:${sessionId}`
            );
            await SessionStateService.telemetry.publishEvent({
                name: 'be_socket_message_group_view',
                params: { ...ga_dims, event_value: 1 },
            });

            sessionState.setViewFromTarget(eventIn.target);
        }

        // Command to change the custom help message
        if (
            eventIn.eventClass === EventClass.Command &&
            eventIn.event === EventType.SetHelpMessage
        ) {
            log.info(
                `(socket, id:${socket.id}), user ${eventIn.subject} SetHelpMessage Command, msg: "${eventIn.target}" session:${sessionId}`
            );
            sessionState.customHelpMessage = eventIn.target;
        }

        // Recording command
        // Update the recording state and notify all listeners
        if (
            eventIn.eventClass === EventClass.Command &&
            eventIn.event === EventType.Recording
        ) {
            log.info(
                `(socket, id:${socket.id}), user ${eventIn.subject} Recording Command ${eventIn.target}`
            );
            await SessionStateService.telemetry.publishEvent({
                name: 'be_socket_message_record_on',
                params: { ...ga_dims, event_value: 1 },
            });
            await SessionStateService.setSessionRecordingState(
                sessionState,
                eventIn.target
            );
            await sessionState.saveToRedis();
            const events =
                SessionStateService.getCurrentStateEvents(sessionState);
            for (const evt of events) {
                if (evt.eventClass === EventClass.Notify) {
                    log.info(
                        `(evt) OUTBOUND to session (recording) ${sessionId}, event: ${JSON.stringify(
                            evt
                        )}`
                    );
                    socket.to(sessionId).broadcast.emit('message', evt);
                }
            }
            doForward = false;
        }

        // Change help wanted state
        if (
            eventIn.eventClass === EventClass.Command &&
            eventIn.event === EventType.HelpWanted
        ) {
            log.info(`(evt) Got HelpWanted Command: ${eventIn}`);
        }

        await sessionState.saveToRedis();

        if (doForward) {
            log.info(
                `(evt) OUTBOUND FORWARDED to session ${sessionId}, event:  ${JSON.stringify(
                    eventIn
                )}`
            );
            socket.to(sessionId).broadcast.emit('message', eventIn);
        }
    }

    /**
     * Get the state for a session, creating a new SessionState object if
     * we haven't already seen it.
     *
     * Notice that the SessionService hold a mutex lock on the whole service
     * while the session is being looked up, so we don't need a mutex
     * at the session level.
     *
     * @param acronym - The acronym for the session
     */
    static async getSession(
        acronym: string | undefined
    ): Promise<SessionState | undefined> {
        log.info(`getSession(${acronym})`);

        if (acronym === undefined) return undefined;
        let sessionState: SessionState | undefined = undefined;
        try {
            await SessionStateService.serviceMutex.acquire();

            // try get from redis
            if (RedisService._().isAvailable()) {
                sessionState = await SessionState.fromRedisByAcronym(acronym);
            } else {
                sessionState = SessionStateService.sessionsByAcronym[acronym];
            }

            // creating new
            if (!sessionState) {
                // lookup class session
                const classSession = await ClassService.getClassSession(
                    acronym
                );
                // found as a class session
                if (classSession) {
                    sessionState = new SessionState(classSession);
                } else {
                    // ... or check adhoc one
                    const adhocSession =
                        await AdHocSessionService.getAdhocSession(acronym);
                    if (adhocSession) {
                        sessionState = new SessionState(adhocSession);
                    }
                }

                // cache it
                if (sessionState) {
                    SessionStateService.sessionsByAcronym[acronym] =
                        sessionState;
                    SessionStateService.allSessions.push(sessionState);

                    await sessionState.saveToRedis();
                }
            }
        } catch (e) {
            log.warn(`getSession(${acronym}) - exception:${e}`);
        } finally {
            SessionStateService.serviceMutex.release();
        }
        log.info(`getSession(${acronym}) got: ${JSON.stringify(sessionState)}`);
        return sessionState;
    }

    /**
     * Get an event that reflects the current recording state of the session
     *
     * @param sessionState the session to query
     * @return event describing current recording state of the session
     */
    static getCurrentRecordingStateEvent(
        sessionState: SessionState
    ): GlobalEvent {
        const e2 = new GlobalEvent(EventClass.Notify, EventType.Recording);
        e2.sessionId = sessionState.acronym;
        e2.subject = ANY_SUBJECT;
        switch (sessionState.recordingState) {
            case RecordingState.ON:
                e2.target = 'on';
                break;
            case RecordingState.OFF:
                e2.target = 'off';
                break;
            case RecordingState.PAUSED:
                e2.target = 'pause';
                break;
            case RecordingState.ERROR:
                e2.target = 'err';
                break;
            default:
                e2.target = '?';
        }
        return e2;
    }

    /**
     * Get a list of events that will update a specific user to the current state of
     * a session.  This will include a command event to switch to the current view, and a
     * notification event for the current recording session
     *
     * @param sessionState
     * @param userId Auth0 ID of the user to be the target of any command events, or ANY_SUBJECT for everybody
     */
    static getCurrentStateEvents(
        sessionState: SessionState,
        userId: string = ANY_SUBJECT
    ): GlobalEvent[] {
        // Return events
        // to notify the user of the current view and recording state
        const evts: GlobalEvent[] = [];
        const e1 = new GlobalEvent(EventClass.Command, EventType.ChangeView);
        e1.subject = userId;
        e1.sessionId = sessionState.acronym;
        // Update target view for the user from this session
        switch (sessionState.currentView) {
            case EClientView.GROUP:
                e1.target = 'group';
                break;
            case EClientView.FOCUS:
                e1.target = 'inst';
                break;
            case EClientView.SPOTLIGHT:
                e1.target = `spot:${sessionState.spotlightUser}`;
                break;
            default:
                e1.target = '';
        }
        evts.push(e1);

        const e2 =
            SessionStateService.getCurrentRecordingStateEvent(sessionState);
        evts.push(e2);

        // New event to set the help message
        const e3 = new GlobalEvent(
            EventClass.Command,
            EventType.SetHelpMessage
        );
        e3.subject = userId;
        e3.sessionId = sessionState.acronym;
        e3.target = sessionState.customHelpMessage;
        evts.push(e3);

        return evts;
    }

    /**
     * Change recording state of a session.  This will initiate recording
     * within Agora if it is not already initiated.
     *
     * @param sessionState - Information about the session state
     * @param recState - new recording state
     */
    static async setSessionRecordingState(
        sessionState: SessionState,
        recState: RecordingState
    ) {
        try {
            await sessionState.acquire();

            if (sessionState.recordingState != recState) {
                // The recording state has changed
                if (recState === RecordingState.ON) {
                    // Start Recording
                    log.debug('(setSessionRecordingState) STARTING Recording');
                    sessionState.recordingSid =
                        await AgoraRecordingService.beginRecording(
                            sessionState.acronym,
                            true
                        );
                    log.debug(
                        `(setSessionRecordingState) Sid: ${sessionState.recordingSid}`
                    );
                }
                if (recState === RecordingState.OFF) {
                    // Stop Recording
                    log.debug('(setSessionRecordingState) STOPPING Recording');
                    await AgoraRecordingService.endRecording(
                        sessionState.recordingSid
                    );
                }
                if (recState === RecordingState.PAUSED) {
                    // Pause Recording - it will not be turned on automatically
                    log.debug('(setSessionRecordingState) PAUSING Recording');
                    await AgoraRecordingService.endRecording(
                        sessionState.recordingSid
                    );
                }
                sessionState.recordingState = recState;
            } else {
                log.debug(
                    `(setSessionRecordingState) recording state already is at ${recState}`
                );
            }
        } finally {
            sessionState.release();
        }
    }

    /**
     * Get all active sessions
     */
    static getAllSessionStates(): SessionState[] {
        return SessionStateService.allSessions;
    }

    /**
     * Remove session by acronym
     */
    static async removeSessionByAcronym(acronym: string) {
        try {
            if (SessionStateService.getAllSessionStates().length == 0) return;
            await SessionStateService.serviceMutex.acquire();
            // Discard expired sessions
            SessionStateService.allSessions =
                SessionStateService.allSessions.filter((sessionState) => {
                    if (sessionState.acronym === acronym) {
                        log.info(
                            `(removeSessionByAcronym) Discarding session: ${sessionState.acronym}`
                        );
                        sessionState.delFromRedis();
                        return false;
                    }
                    return true;
                });
        } catch (err) {
            log.error(`removeSessionByAcronym failed: ${err}`);
        } finally {
            SessionStateService.serviceMutex.release();
        }
    }

    /**
     * Remove expired sessions from the cache
     */
    static async removeExpiredSessions() {
        try {
            if (SessionStateService.getAllSessionStates().length == 0) return;
            await SessionStateService.serviceMutex.acquire();
            // Discard expired sessions
            SessionStateService.allSessions =
                SessionStateService.allSessions.filter((sessionState) => {
                    if (sessionState.isExpired()) {
                        log.info(
                            `(removeExpiredSessions) Discarding expired session: ${sessionState.acronym}`
                        );
                        sessionState.delFromRedis();
                        return false;
                    }
                    return true;
                });
        } catch (err) {
            log.error(`removeExpiredSessions failed:${err}`);
        } finally {
            SessionStateService.serviceMutex.release();
        }
    }

    /**
     * Cleanup recording state in case server restarts or exits
     */
    static async cleanupOrphanedSessions() {
        // Check for any recording entries that were orphaned by a server restart, shutdown, exit, crash...
        const recordingEntriesDb = await RecordingModel.find({
            state: RecordingStatus.Ongoing,
        });

        if (recordingEntriesDb) {
            log.debug(
                `(cleanupOrphanedSessions) Found ${recordingEntriesDb.length} recording entries with 'Ongoing' status`
            );
            // check for each of these with agora to see if an active agora session is available

            const $recordingEntries = recordingEntriesDb.map(async (entry) => {
                try {
                    if (entry.resourceId && entry.sid && entry.acronym) {
                        const resp = await AgoraRecordingService.queryRecording(
                            entry.resourceId,
                            entry.sid,
                            true
                        );

                        if (resp) {
                            log.debug(
                                `(cleanupOrphanedSessions) Active Agora session still in progress for SID ${entry.sid}`
                            );

                            const sessionState = await this.getSession(
                                entry.acronym
                            );

                            if (sessionState) {
                                if (sessionState.isOpen()) {
                                    await AgoraRecordingService.recreateRecording(
                                        entry.acronym,
                                        entry.sid,
                                        entry.resourceId,
                                        true
                                    );

                                    sessionState.recordingSid = entry.sid;
                                    sessionState.recordingState =
                                        RecordingState.ON;
                                } else {
                                    log.debug(
                                        `(cleanupOrphanedSessions) Session is no longer open, Setting recording state to 'Exited' for entry with SID ${entry.sid}`
                                    );
                                    entry.state = RecordingStatus.Exited;
                                }
                            }
                        } else {
                            log.debug(
                                `(cleanupOrphanedSessions) No Agora sessions currently active for SID ${entry.sid}`
                            );
                            entry.recordingExited();
                        }
                    } else {
                        entry.recordingExited();
                    }
                } catch (e) {
                    log.error(`(cleanupOrphanedSessions) ERROR: ${e}`);

                    entry.recordingExited();
                } finally {
                    await entry.save();
                }
            });

            await Promise.all($recordingEntries);
        }

        // Check for any recording entries that are completed or exited that do not have an end time
        const exitedRecordingEntriesDb = await RecordingModel.find({
            $or: [
                {
                    state: RecordingStatus.Completed,
                },
                {
                    state: RecordingStatus.Exited,
                },
            ],
            endTime: undefined,
        });

        if (exitedRecordingEntriesDb && exitedRecordingEntriesDb.length > 0) {
            log.debug(
                `(cleanupOrphanedSessions) Found ${exitedRecordingEntriesDb.length} finished recording entries with no end time`
            );

            const $exitedRecordingEntries = exitedRecordingEntriesDb.map(
                async (entry) => {
                    entry.setEndTime();
                    await entry.save();
                }
            );

            await Promise.all($exitedRecordingEntries);
        }
    }

    /**
     * Periodically check sessions, manage their recording state (auto-starting and stopping) and
     * remove expired sessions
     *
     */
    static async manageSessions(): Promise<GlobalEvent[]> {
        log.debug('(manageSessions)');
        const events$ = SessionStateService.getAllSessionStates().map(
            async (sessionState): Promise<GlobalEvent[]> => {
                // Start/Stop recording on sessions as needed
                // Notice that we don't start the recording state here.  Currently, it is
                // started when a person joins the session and it is not started.
                let events: GlobalEvent[] = [];
                if (sessionState.isActive() && sessionState.isOpen()) {
                    if (sessionState.recordingState === RecordingState.OFF) {
                        // Recording is OFF, turn in ON
                        log.info(
                            `(manageSessions) Starting recording for session: ${sessionState.acronym}`
                        );
                        await SessionStateService.setSessionRecordingState(
                            sessionState,
                            RecordingState.ON
                        );
                        events.push(
                            SessionStateService.getCurrentRecordingStateEvent(
                                sessionState
                            )
                        );
                    } else if (
                        sessionState.recordingState === RecordingState.ON
                    ) {
                        // Query Agora to see if the recording is still on
                        const recording =
                            await AgoraRecordingService.getRecording(
                                sessionState.recordingSid
                            );
                        // recording will be null if Agora recording is disabled
                        if (recording && !recording.agora) {
                            // Agora says its stopped, remember it as OFF
                            log.warn(
                                `(manageSessions) Recording has stopped: ${sessionState.acronym}`
                            );
                            sessionState.recordingState = RecordingState.OFF;
                            sessionState.recordingSid = '';
                            events.push(
                                SessionStateService.getCurrentRecordingStateEvent(
                                    sessionState
                                )
                            );
                        } else {
                            log.debug(
                                `(manageSessions) Session recording is ON for session: ${sessionState.acronym}`
                            );
                            events.push(
                                SessionStateService.getCurrentRecordingStateEvent(
                                    sessionState
                                )
                            );
                        }
                    }
                }

                if (
                    sessionState.isAfterClose() &&
                    sessionState.recordingState === RecordingState.ON
                ) {
                    const recordingEnabled: boolean =
                        (process.env.AGORA_RECORDING_ENABLED || 'false') ===
                        'true';

                    const recording = await AgoraRecordingService.getRecording(
                        sessionState.recordingSid
                    );
                    if (recording && recording.agora) {
                        // Status is OK
                        log.info(
                            `(manageSessions) Stopping recording after close of session: ${sessionState.acronym}`
                        );
                        await SessionStateService.setSessionRecordingState(
                            sessionState,
                            RecordingState.OFF
                        );
                    } else if (!recordingEnabled) {
                        sessionState.recordingState = RecordingState.OFF;
                    } else {
                        sessionState.recordingState = RecordingState.OFF;
                        log.warn(
                            '(manageSessions) Not Stopping recording after close of session, it has already stopped or recording is disabled on the server.'
                        );
                    }
                    events.push(
                        SessionStateService.getCurrentRecordingStateEvent(
                            sessionState
                        )
                    );
                }
                return events;
            }
        );

        const events = await Promise.all(events$);
        // Discard expired sessions
        await SessionStateService.removeExpiredSessions();
        // @ts-ignore
        return [].concat.apply([], events); // This just flattens the events arrays
    }
}
