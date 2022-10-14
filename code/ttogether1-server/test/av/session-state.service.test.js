require('dotenv').config();
let moment = require('moment-timezone');

const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const {
    mongoGlobalTestSetup,
    mongoGlobalTestTeardown,
    getMongoConfig,
} = require('../config/testGlobal');

const { Logger } = require('../../src/core/logger.service');
const {
    SessionStateService,
} = require('../../src/av/session-state.service.ts');
const { buildCourseSeedData } = require('../../src/seed/course.sample');
const { Class, ClassModel } = require('../../src/db/class.db');
const { SessionState } = require('../../src/av/session-state.service');
const { RedisService } = require('../../src/core/redis.service');

let db;
const log = Logger.logger('SessionsTests');

const BOT_CLASS = 'PREFLT1G1';
const TEST_SESSION = 'PREFLT1G1-201014';
const TEST_USER = 'auth0|5f176555afdb6c00132e7494';

describe('redis ops', () => {
    it('SessionState redis methods', async () => {
        await RedisService._().init();

        let sess = await SessionState.fromRedisByAcronym('boom');
        expect(sess).toBeUndefined();

        let sess2 = new SessionState(undefined);
        sess2.acronym = 'boom';
        await sess2.saveToRedis();

        let sess3 = await SessionState.fromRedisByAcronym('boom');
        expect(sess3).toBeDefined();

        sess3.delFromRedis();

        let sess4 = await SessionState.fromRedisByAcronym('boom');
        expect(sess4).toBeUndefined();
    });
});

describe('Sessions Service tests', () => {
    /**
     * Setup and teardown
     */
    beforeAll(async () => {
        mongoConfig = await getMongoConfig();
        await mongoGlobalTestSetup();
        await mongoose.connect(mongoConfig.mongoUri, {
            useNewUrlParser: true,
            useCreateIndex: true,
            poolSize: 2,
        });
        db = mongoose.connection;
        db.on('error', log.error.bind(console, 'connection error:'));
        db.once('open', function () {
            log.debug("we're connected!");
        });

        await RedisService._().init();
    });
    afterAll(async () => {
        await mongoose.connection.close();
        await mongoGlobalTestTeardown();
    });

    beforeEach(async () => {
        await buildCourseSeedData(null);
        SessionStateService.reset();
    });

    afterEach(async () => {
        if (mongoose && mongoose.connection && mongoose.connection.db) {
            await mongoose.connection.db.dropDatabase();
        }
    });

    /**
     * Tests start here
     */
    it('remembers a simple session', async () => {
        // Session not not have any attendees in the DB
        let klass = await ClassModel.findOne({ acronym: BOT_CLASS });
        expect(klass).toBeTruthy();
        let session = klass.findSessionByAcronym(TEST_SESSION);
        expect(session).toBeTruthy();

        let sessionState = await SessionStateService.getSession(TEST_SESSION);
        expect(sessionState).toBeTruthy();

        expect(sessionState.userHasAttended(TEST_USER)).toBeFalsy();
        expect(sessionState.userIsActive(TEST_USER)).toBeFalsy();

        // This should add the session to the cache and also
        // store attendence on the session
        sessionState.addUser(TEST_USER);
        const sessions = SessionStateService.getAllSessionStates();
        expect(sessions).toBeTruthy();
        expect(sessions.length).toEqual(1);
        sessionState = sessions[0];
        expect(sessionState.acronym).toEqual(TEST_SESSION);
        expect(sessionState.attendees).toBeTruthy();
        expect(sessionState.attendees.length).toEqual(1);
        expect(sessionState.attendees.includes(TEST_USER)).toBeTruthy();

        expect(sessionState.userHasAttended(TEST_USER)).toBeTruthy();
        expect(sessionState.userIsActive(TEST_USER)).toBeTruthy();

        sessionState.removeUser(TEST_USER);
        expect(sessionState.userHasAttended(TEST_USER)).toBeTruthy();
        expect(sessionState.userIsActive(TEST_USER)).toBeFalsy();
    });

    it('remembers an existing session', async () => {
        const sessionState = await SessionStateService.getSession(TEST_SESSION);
        expect(sessionState).toBeTruthy();
        if (sessionState) {
            sessionState.addUser(TEST_USER);
            sessionState.addUser(TEST_USER);
        }

        const sessionInfo2 = await SessionStateService.getSession(TEST_SESSION);

        const sessions = SessionStateService.getAllSessionStates();
        expect(sessions).toBeTruthy();
        expect(sessions.length).toEqual(1);
    });

    it('retrieves an existing session', async () => {
        const sessionState = await SessionStateService.getSession(TEST_SESSION);
        sessionState.addUser(TEST_USER);
        const session = await SessionStateService.getSession(TEST_SESSION);
        expect(session).toBeTruthy();
        expect(session.acronym).toEqual(TEST_SESSION);
    });

    const TEST_SESSION2 = 'MTSTANDG1-201207';
    const TEST_USER2 = 'auth0|5f176555afdb6c00132e7494';
    const TEST_USER3 = 'auth0|5f1765ea965b8c0019fe78b6';

    it('user joins during lobby and check states', async () => {
        const sessionState = await SessionStateService.getSession(
            TEST_SESSION2
        );
        expect(sessionState.acronym).toEqual(TEST_SESSION2);

        // Lobby is open for 1 minute, no users
        let now = moment(sessionState.lobbyOpenTime).add(1, 'm');
        sessionState.setEffectiveTime(now);

        expect(sessionState.isOpen()).toBeTruthy();
        expect(sessionState.isInSession()).toBeFalsy();
        expect(sessionState.isActive()).toBeFalsy();
        expect(sessionState.isExpired()).toBeFalsy();

        // Add a user
        sessionState.addUser(TEST_USER2);
        expect(sessionState.isOpen()).toBeTruthy();
        expect(sessionState.isInSession()).toBeFalsy();
        expect(sessionState.isActive()).toBeTruthy();
        expect(sessionState.isExpired()).toBeFalsy();

        // Session is open for 10 minutes
        now = moment(sessionState.scheduledStartTime).add(10, 'm');
        sessionState.setEffectiveTime(now);
        expect(sessionState.isOpen()).toBeTruthy();
        expect(sessionState.isInSession()).toBeTruthy();
        expect(sessionState.isActive()).toBeTruthy();
        expect(sessionState.isExpired()).toBeFalsy();

        // Not in session
        now = moment(sessionState.scheduledEndTime).add(1, 'm');
        sessionState.setEffectiveTime(now);
        expect(sessionState.isOpen()).toBeTruthy();
        expect(sessionState.isInSession()).toBeFalsy();
        expect(sessionState.isActive()).toBeTruthy();
        expect(sessionState.isExpired()).toBeFalsy();

        // Remove the user from the session
        sessionState.removeUser(TEST_USER2);
        expect(sessionState.isActive()).toBeFalsy();
        expect(sessionState.isOpen()).toBeTruthy();
        expect(sessionState.isInSession()).toBeFalsy();
        expect(sessionState.isActive()).toBeFalsy();
        expect(sessionState.isExpired()).toBeFalsy();

        // Lobby is closed
        now = moment(sessionState.lobbyCloseTime).add(1, 'm');
        sessionState.setEffectiveTime(now);
        expect(sessionState.isOpen()).toBeFalsy();
        expect(sessionState.isInSession()).toBeFalsy();
        expect(sessionState.isActive()).toBeFalsy();
        expect(sessionState.isExpired()).toBeFalsy();

        // Session is expired
        now = moment(sessionState.expires).add(1, 'm');
        sessionState.setEffectiveTime(now);
        expect(sessionState.isExpired()).toBeTruthy();
    });

    it('multiple users join a session', async () => {
        const sessionState = await SessionStateService.getSession(
            TEST_SESSION2
        );
        expect(sessionState.acronym).toEqual(TEST_SESSION2);

        let now = moment(sessionState.lobbyOpenTime).add(1, 'm'); // Lobby is open for 1 minute
        sessionState.setEffectiveTime(now);
        expect(sessionState.isOpen()).toBeTruthy();
        expect(sessionState.isInSession()).toBeFalsy();
        expect(sessionState.isActive()).toBeFalsy();
        expect(sessionState.isExpired()).toBeFalsy();

        sessionState.addUser(TEST_USER2);
        expect(sessionState.isActive()).toBeTruthy();

        sessionState.addUser(TEST_USER3);
        expect(sessionState.isActive()).toBeTruthy();

        sessionState.removeUser(TEST_USER2);
        expect(sessionState.isActive()).toBeTruthy();
        sessionState.removeUser(TEST_USER3);
        expect(sessionState.isActive()).toBeFalsy();
    });

    it('get notification events on session join - not recording', async () => {
        const sessionState = await SessionStateService.getSession(
            TEST_SESSION2
        );
        expect(sessionState.acronym).toEqual(TEST_SESSION2);
        let now = moment(sessionState.lobbyOpenTime).add(1, 'm'); // Lobby is open for 1 minute
        sessionState.setEffectiveTime(now);

        sessionState.addUser(TEST_USER2);
        expect(sessionState.isActive()).toBeTruthy();
        expect(sessionState.isRecording()).toBeFalsy();

        const events = SessionStateService.getCurrentStateEvents(
            sessionState,
            TEST_USER2
        );
        // Check that the required events are returned.
        expect(events.length).toEqual(2);
        let gotChangeView = false;
        let gotRecording = false;
        events.forEach((evt) => {
            expect(evt.sessionId).toEqual(TEST_SESSION2);
            switch (evt.event) {
                case 'CV': // Change View command event
                    gotChangeView = true;
                    expect(evt.target).toEqual('group');
                    expect(evt.eventClass).toEqual('C');
                    expect(evt.subject).toEqual(TEST_USER2);
                    break;
                case 'RE': // Recording state is OFF - get notification event
                    gotRecording = true;
                    expect(evt.target).toEqual('off');
                    expect(evt.eventClass).toEqual('N');
                    break;
                default:
                    throw new Error('Unexpect event type:', evt.event);
            }
        });
        expect(gotChangeView).toBeTruthy();
        expect(gotRecording).toBeTruthy();
    });

    /**
     * This covers the scenario where a user joins a session that they
     * are aleady in.
     */
    it('session redundant join', async () => {
        const sessionState = await SessionStateService.getSession(
            TEST_SESSION2
        );
        expect(sessionState.acronym).toEqual(TEST_SESSION2);
        let now = moment(sessionState.lobbyOpenTime).add(1, 'm'); // Lobby is open for 1 minute
        sessionState.setEffectiveTime(now);
        sessionState.addUser(TEST_USER2);

        expect(sessionState.isActive()).toBeTruthy();
        expect(sessionState.isRecording()).toBeFalsy();
        expect(sessionState.userIsActive(TEST_USER2)).toBeTruthy();

        // Check that the required events are returned.
        const events = SessionStateService.getCurrentStateEvents(
            sessionState,
            TEST_USER2
        );
        expect(events.length).toEqual(2);

        sessionState.addUser(TEST_USER2);
        expect(sessionState.isActive()).toBeTruthy();
        expect(sessionState.isRecording()).toBeFalsy();
        expect(sessionState.userIsActive(TEST_USER2)).toBeTruthy();
        expect(sessionState.activeUsers.length).toEqual(1);
        expect(sessionState.attendees.length).toEqual(1);
    });

    it('get notification events on session join - recording on/off', async () => {
        const sessionState = await SessionStateService.getSession(
            TEST_SESSION2
        );
        expect(sessionState.acronym).toEqual(TEST_SESSION2);
        let now = moment(sessionState.lobbyOpenTime).add(1, 'm'); // Lobby is open for 1 minute
        sessionState.setEffectiveTime(now);

        // Turn recording ON
        sessionState.recordingState = 'on';
        expect(sessionState.isRecording()).toBeTruthy();

        sessionState.addUser(TEST_USER2);
        expect(sessionState.isActive()).toBeTruthy();

        let events = SessionStateService.getCurrentStateEvents(
            sessionState,
            TEST_USER2
        );
        // Check that the required events are returned.
        expect(events.length).toEqual(2);
        let gotChangeView = false;
        let gotRecording = false;
        events.forEach((evt) => {
            expect(evt.sessionId).toEqual(TEST_SESSION2);
            switch (evt.event) {
                case 'CV': // Change View command event
                    gotChangeView = true;
                    expect(evt.target).toEqual('group');
                    expect(evt.eventClass).toEqual('C');
                    expect(evt.subject).toEqual(TEST_USER2);
                    break;
                case 'RE': // Recording state is ON - get notification event
                    gotRecording = true;
                    expect(evt.target).toEqual('on');
                    expect(evt.eventClass).toEqual('N');
                    break;
                default:
                    throw new Error('Unexpect event type:', evt.event);
            }
        });
        expect(gotChangeView).toBeTruthy();
        expect(gotRecording).toBeTruthy();

        // Turn recording OFF
        sessionState.recordingState = 'off';
        expect(sessionState.isRecording()).toBeFalsy();
        events = SessionStateService.getCurrentStateEvents(
            sessionState,
            TEST_USER2
        );
        gotChangeView = false;
        gotRecording = false;
        events.forEach((evt) => {
            expect(evt.sessionId).toEqual(TEST_SESSION2);
            switch (evt.event) {
                case 'CV': // Change View command event
                    gotChangeView = true;
                    expect(evt.target).toEqual('group');
                    expect(evt.eventClass).toEqual('C');
                    expect(evt.subject).toEqual(TEST_USER2);
                    break;
                case 'RE': // Recording state is OFF - get notification event
                    gotRecording = true;
                    expect(evt.target).toEqual('off');
                    expect(evt.eventClass).toEqual('N');
                    break;
                default:
                    throw new Error('Unexpect event type:', evt.event);
            }
        });
        expect(gotChangeView).toBeTruthy();
        expect(gotRecording).toBeTruthy();
    });

    it('change session view - instructor', async () => {
        const sessionState = await SessionStateService.getSession(
            TEST_SESSION2
        );
        expect(sessionState.acronym).toEqual(TEST_SESSION2);
        let now = moment(sessionState.lobbyOpenTime).add(1, 'm'); // Lobby is open for 1 minute
        sessionState.setEffectiveTime(now);

        expect(sessionState.currentView).toEqual('group');
        sessionState.setViewFromTarget('inst');

        events = SessionStateService.getCurrentStateEvents(
            sessionState,
            TEST_USER2
        );
        gotChangeView = false;
        gotRecording = false;
        events.forEach((evt) => {
            expect(evt.sessionId).toEqual(TEST_SESSION2);
            switch (evt.event) {
                case 'CV': // Change View command event
                    gotChangeView = true;
                    expect(evt.target).toEqual('inst');
                    expect(evt.eventClass).toEqual('C');
                    expect(evt.subject).toEqual(TEST_USER2);
                    break;
                case 'RE': // Recording state is OFF - get notification event
                    gotRecording = true;
                    expect(evt.target).toEqual('off');
                    expect(evt.eventClass).toEqual('N');
                    break;
                default:
                    throw new Error('Unexpect event type:', evt.event);
            }
        });
        expect(gotChangeView).toBeTruthy();
        expect(gotRecording).toBeTruthy();
    });

    it('change view to spotlight', async () => {
        const sessionState = await SessionStateService.getSession(
            TEST_SESSION2
        );
        expect(sessionState.acronym).toEqual(TEST_SESSION2);
        let now = moment(sessionState.lobbyOpenTime).add(1, 'm'); // Lobby is open for 1 minute
        sessionState.setEffectiveTime(now);

        expect(sessionState.currentView).toEqual('group');

        sessionState.setViewFromTarget('inst');
        expect(sessionState.currentView).toEqual('inst');
        expect(sessionState.spotlightUser).toBeFalsy();

        sessionState.setViewFromTarget('group');
        expect(sessionState.currentView).toEqual('group');
        expect(sessionState.spotlightUser).toBeFalsy();

        sessionState.setViewFromTarget('bogus');
        expect(sessionState.currentView).toEqual('group');
        expect(sessionState.spotlightUser).toBeFalsy();
    });

    it('removes expired sessions', async () => {
        const sessionState = await SessionStateService.getSession(TEST_SESSION);
        sessionState.addUser(TEST_USER);
        const session = await SessionStateService.getSession(TEST_SESSION);
        expect(session).toBeTruthy();
        expect(session.acronym).toEqual(TEST_SESSION);

        expect(SessionStateService.getAllSessionStates().length).toEqual(1);

        // Set the session to be open - make sure it isn't removed
        let now = moment(sessionState.lobbyOpenTime).add(1, 'm'); // Lobby is open for 1 minute
        sessionState.setEffectiveTime(now);
        await SessionStateService.removeExpiredSessions();
        expect(SessionStateService.getAllSessionStates().length).toEqual(1);

        // Set the session to be expired
        now = moment(sessionState.expires).add(1, 'm');
        sessionState.setEffectiveTime(now);
        expect(sessionState.isExpired()).toBeTruthy();

        await SessionStateService.removeExpiredSessions();
        expect(SessionStateService.getAllSessionStates().length).toEqual(0);
    });

    it('auto-starts recording for an active session', async () => {
        const sessionState = await SessionStateService.getSession(
            TEST_SESSION2
        );
        expect(sessionState.acronym).toEqual(TEST_SESSION2);

        // Lobby is open for 1 minute, no users
        let now = moment(sessionState.lobbyOpenTime).add(1, 'm');
        sessionState.setEffectiveTime(now);
        expect(sessionState.isOpen()).toBeTruthy();
        expect(sessionState.isActive()).toBeFalsy();
        expect(sessionState.isExpired()).toBeFalsy();

        // Recording should still be be OFF
        let events = await SessionStateService.manageSessions();
        expect(sessionState.isRecording()).toBeFalsy();
        expect(events.length).toEqual(0);

        // Add a user, the session becomes active
        sessionState.addUser(TEST_USER2);
        expect(sessionState.isOpen()).toBeTruthy();
        expect(sessionState.isInSession()).toBeFalsy();
        expect(sessionState.isActive()).toBeTruthy();
        expect(sessionState.isExpired()).toBeFalsy();

        // This should turn on recording
        events = await SessionStateService.manageSessions();
        log.debug('(test1) sessionState:', JSON.stringify(sessionState));
        expect(sessionState.isRecording()).toBeTruthy();
        expect(events.length).toEqual(1);
        expect(events[0].event).toEqual('RE');
        expect(events[0].eventClass).toEqual('N');
        expect(events[0].sessionId).toEqual(TEST_SESSION2);
        expect(events[0].target).toEqual('on');
    });

    it('does not auto-start recording for an paused session', async () => {
        const sessionState = await SessionStateService.getSession(
            TEST_SESSION2
        );
        expect(sessionState.acronym).toEqual(TEST_SESSION2);

        // Lobby is open for 1 minute, no users
        let now = moment(sessionState.lobbyOpenTime).add(1, 'm');
        sessionState.setEffectiveTime(now);
        expect(sessionState.isOpen()).toBeTruthy();
        expect(sessionState.isActive()).toBeFalsy();
        expect(sessionState.isExpired()).toBeFalsy();

        // Pause recording
        let events = await SessionStateService.manageSessions();
        expect(sessionState.isRecording()).toBeFalsy();
        sessionState.recordingState = 'pause';

        // Add a user, the session becomes active
        sessionState.addUser(TEST_USER2);
        expect(sessionState.isOpen()).toBeTruthy();
        expect(sessionState.isInSession()).toBeFalsy();
        expect(sessionState.isActive()).toBeTruthy();
        expect(sessionState.isExpired()).toBeFalsy();

        // Should Not be recording
        events = await SessionStateService.manageSessions();
        expect(sessionState.isRecording()).toBeFalsy();
        expect(events.length).toEqual(0);

        sessionState.recordingState = 'off';
        // Should Auto-start recording
        events = await SessionStateService.manageSessions();
        expect(sessionState.isRecording()).toBeTruthy();
        expect(events.length).toEqual(1);
    });

    it('stops recording after the session is closed', async () => {
        const sessionState = await SessionStateService.getSession(
            TEST_SESSION2
        );
        expect(sessionState.acronym).toEqual(TEST_SESSION2);

        // Lobby is open for 1 minute, no users
        let now = moment(sessionState.lobbyOpenTime).add(1, 'm');
        sessionState.setEffectiveTime(now);
        expect(sessionState.isOpen()).toBeTruthy();
        expect(sessionState.isActive()).toBeFalsy();
        expect(sessionState.isExpired()).toBeFalsy();

        // Add a user, the session becomes active
        sessionState.addUser(TEST_USER2);
        expect(sessionState.isOpen()).toBeTruthy();
        expect(sessionState.isInSession()).toBeFalsy();
        expect(sessionState.isActive()).toBeTruthy();
        expect(sessionState.isExpired()).toBeFalsy();

        // Should  be recording
        let events = await SessionStateService.manageSessions();
        expect(sessionState.isRecording()).toBeTruthy();
        // Should have one notification event to turn recording ON
        expect(events.length).toEqual(1);
        expect(events[0].event).toEqual('RE');
        expect(events[0].eventClass).toEqual('N');
        expect(events[0].sessionId).toEqual(TEST_SESSION2);
        expect(events[0].target).toEqual('on');

        now = moment(sessionState.lobbyCloseTime).add(1, 'm');
        sessionState.setEffectiveTime(now);
        expect(sessionState.isAfterClose()).toBeTruthy();
        // Should Auto-stop recording
        events = await SessionStateService.manageSessions();
        expect(sessionState.isRecording()).toBeFalsy();
        expect(events.length).toEqual(1);
        expect(events[0].event).toEqual('RE');
        expect(events[0].eventClass).toEqual('N');
        expect(events[0].sessionId).toEqual(TEST_SESSION2);
        expect(events[0].target).toEqual('off');
    });
});
