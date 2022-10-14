/**
 * This controller is deprecated.  Sessions will no longer
 * be a separate collection in Mongo, they will be contained
 * within classes
 */
import { Request, Response, NextFunction } from 'express';
let moment = require('moment-timezone');
require('moment-recur');
import { SessionState, SessionStateService } from '../av/session-state.service';
import { Logger } from '../core/logger.service';
import { AuthController } from './auth.controller';
var jwt = require('jsonwebtoken');
require('dotenv').config();

const log = Logger.logger('SessionStateController');

export class SessionStateController extends AuthController {
    /**
     * Mark the current user as having joined a session, and run manageSessions().  This
     * is useful for testing purposes only, for example to trigger
     * recording state change
     *
     * For testing purposes, it is often useful to warp the time on the session first
     * so that manageSessions() will manage session state based on the correct time.
     *
     * @param req M
     * @param res
     */
    static apiJoinSession = async (req: Request, res: Response) => {
        const user = res.locals.userInfo; // passed from middleware
        const t: string = req.query.forceTime as string;
        let effectiveTime: any;
        const acronym = req.params['acronym'];
        if (!acronym) {
            log.warn('(apiJoinSession) Missing session acronym');
            res.status(400).send('ERROR: Missing Acronym for Session');
            return;
        }
        const sessionState = await SessionStateService.getSession(acronym);
        if (sessionState) {
            // @ts-ignore
            sessionState.addUser(user.userId);
            await SessionStateService.manageSessions();
            res.status(200).send(
                SessionStateController.mapSession(sessionState)
            );
        } else {
            res.status(500).send('Error: Cannot get session:' + acronym);
        }
    };

    static apiTimeWarpSessionTime = async (req: Request, res: Response) => {
        const t: string = req.query.forceTime as string;
        let effectiveTime: any;
        const acronym = req.params['acronym'];
        if (!acronym) {
            log.warn('(apiTimeWarpSessionTime) Missing session acronym');
            res.status(400).send('ERROR: Missing Acronym for Session');
            return;
        }
        const sessionInfo = await SessionStateService.getSession(acronym);
        if (!sessionInfo) {
            res.status(404).send('Unknown session: ' + acronym);
            return;
        }

        if (
            t &&
            t.match(
                /(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})\.(\d{3})Z/
            )
        ) {
            effectiveTime = moment(t);
        } else {
            effectiveTime = moment(sessionInfo.lobbyOpenTime).add(1, 'sec');
        }
        sessionInfo.setEffectiveTime(effectiveTime);
        log.debug(
            `(apiTimeWarpSessionTime) Time Warping Session: ${acronym}, effectiveTime: ${effectiveTime}`
        );
        const results = {
            asOf: moment().toISOString(),
            session: SessionStateController.mapSession(sessionInfo),
        };

        res.status(200).json(results);
    };

    /**
     * Map a SessionState to an object returned by the API.
     * This will remove some fields and add fields for the
     * current state.
     *
     * @param sessionState Existing sessionState from the cache
     */
    static mapSession(sessionState: SessionState): any {
        const state: any = JSON.parse(JSON.stringify(sessionState));
        state.isActive = sessionState.isActive();
        state.isInSession = sessionState.isInSession();
        state.isOpen = sessionState.isOpen();
        state.isExpired = sessionState.isExpired();
        state.effectiveTime = sessionState.getEffectiveTime();
        state.class = state.klass;
        delete state.klass;
        delete state.log;
        return state;
    }

    /**
     * Get all active sessions from the server's cache
     * This is used for debugging only
     */
    static apiGetActiveSessions = async (req: Request, res: Response) => {
        try {
            const sessionStates =
                await SessionStateService.getAllSessionStates();
            const results = {
                asOf: moment().toISOString(),
                sessions: sessionStates.map(SessionStateController.mapSession),
            };
            res.json(results);
        } catch (e) {
            res.status(500).send(
                'ERROR getting all active sessions: ' + e.message
            );
        }
    };
}
