import { Request, Response } from 'express';
import { AgoraClientService } from '../av/agora-client.service';
import { UserInfo, UserService } from '../av/user.service';
import { Logger } from '../core/logger.service';
import { AgoraRecordingService } from '../av/agora-recording.service';
import {
    AgoraCallbackPayload,
    RecordingEventType,
} from '../av/agora-callback.types';
import { on } from 'process';
import { AgoraRecording } from '../av/agora-recording';
import { AuthController } from './auth.controller';
import { ClassModel, Class } from '../db/class.db';
import { AdHocSession, AdHocSessionModel } from '../db/session.db';
import { RecordingModel, RecordingState } from '../db/recording.db';
import { ErrorCode } from '../db/helpers';

const assert = require('assert');
var jwt = require('jsonwebtoken');

const log = Logger.logger('AgoraController');

/**
 * Controller implementing the Agora API exposed to the client
 */
export class AgoraController extends AuthController {
    /**
     * Get a token for access to a session for the current user.  Also
     * assigns a unique user number for the user to use in joining the
     * session (necessary because Agora requires numeric IDs when recording)
     * Query Params:
     *
     * @param req HTTP Request
     * @param res HTTP Response
     */
    public static apiGetSessionUserToken = async (
        req: Request,
        res: Response
    ) => {
        const sessionId = req.params['sessionId']; // Name of the Agora channel/Together1 session
        const userNumberStr = req.params['userNumber']; // User number for Token, if different than the authenticated user
        const userInfo = res.locals.userInfo as UserInfo; // passed from middleware
        let session = undefined;

        try {
            assert(userInfo);
            assert(sessionId && sessionId.length > 0);
            // We still get the UID from the query string, but
            // now the Agora token is associated with the userNumber
            if (!userInfo || !userInfo.userId) {
                res.status(403).send('No user token');
                return;
            }

            const klass = (await ClassModel.findOne({
                'sessions.acronym': sessionId,
            })) as Class;

            if (klass) {
                session = klass.findSessionByAcronym(sessionId);

                if (!session) {
                    res.status(404).send('No such session: ' + sessionId);
                    return;
                }

                // Check at session level
                if (
                    !klass.participants.includes(userInfo.userId) &&
                    session.instructorId !== userInfo.userId
                ) {
                    throw new ErrorCode(
                        'User does not have access to this session',
                        401
                    );
                }
            }
        } catch (e) {
            res.status(400).send('Missing session id' + e.message);
            return;
        }
        try {
            let userNumber = Number.parseInt(userNumberStr);
            if (Number.isNaN(userNumber)) {
                // @ts-ignore
                userNumber = userInfo?.userNumber;
            }
            log.debug(
                `(apiGetSessionUserToken) Generating token for user number: ${userNumber}`
            );
            // @ts-ignore
            const tokenStr = AgoraClientService.getChannelUserToken(
                sessionId,
                userNumber
            );
            // @ts-ignore
            res.json({
                token: tokenStr,
                session: session,
                userNumber: userNumber,
            });
        } catch (e) {
            res.status(500).send('Cannot generate Agora token' + e.message);
        }
    };

    /**
     * Get a token for access to an adhoc session for the current user.  Also
     * assigns a unique user number for the user to use in joining the
     * session (necessary because Agora requires numeric IDs when recording)
     * Query Params:
     *
     * @param req HTTP Request
     * @param res HTTP Response
     */
    public static apiGetAdhocSessionUserToken = async (
        req: Request,
        res: Response
    ) => {
        const sessionId = req.params['sessionId']; // Name of the Agora channel/Together1 session
        const userInfo = res.locals.userInfo; // passed from middleware
        let session = undefined;
        try {
            assert(userInfo);
            assert(sessionId && sessionId.length > 0);
            // We still get the UID from the query string, but
            // now the Agora token is associated with the userNumber

            const session = (await AdHocSessionModel.findOne({
                acronym: sessionId,
            })) as AdHocSession;
            if (!session) {
                res.status(404).send('No such adhoc session: ' + sessionId);
                return;
            }

            if (
                !session.participants.includes(userInfo.userId) &&
                !session.instructorId.includes(userInfo.userId)
            ) {
                res.status(401).send(
                    'User does not have access to this session'
                );
                return;
            }
        } catch (e) {
            res.status(400).send('Missing session id' + e.message);
            return;
        }
        try {
            // @ts-ignore
            const tokenStr = AgoraClientService.getChannelUserToken(
                sessionId,
                userInfo.userNumber
            );
            // @ts-ignore
            res.json({
                token: tokenStr,
                session: session,
                userNumber: userInfo.userNumber,
            });
        } catch (e) {
            res.status(500).send('Cannot generate Agora token' + e.message);
        }
    };

    /**
     * Aquire Agora cloud recording resource and start the recording.  The response
     * will contain a JSON object including sid and the usual 'success' property
     *
     * @param req HTTP Request HTTP Request
     * @param res HTTP Response HTTP Response
     */
    public static apiBeginRecording = async (req: Request, res: Response) => {
        let channel = '';
        let composite = true;
        try {
            // Check request validity
            channel = req.params['channel']; // Name of the Agora channel/Together1 session
            const mode = req.params['mode'].toLowerCase(); // Mode 'individual', or 'mix'

            assert(channel && channel.length > 0, 'Missing Agora Channel Name');
            assert(mode && mode.length > 0, 'Missing recording mode');
            assert(
                mode === 'individual' || mode === 'mix',
                'Invalid recording mode'
            );
            composite = mode === 'mix';
        } catch (e) {
            res.status(400).send('Invalid Request: ' + e.message);
            return;
        }
        try {
            const sid = await AgoraRecordingService.beginRecording(
                channel,
                composite
            );
            res.status(200).json({
                success: true,
                sid: sid,
            });
        } catch (err) {
            log.error(`(apiBeginRecording) ERROR: ${err}`);
            res.status(500).send(`Internal server error: ${err}`);
        }
    };

    /**
     * End Agora cloud recording
     * @param req HTTP Request
     * @param res HTTP Respojse
     */
    public static apiEndRecording = async (req: Request, res: Response) => {
        let sid = '';

        try {
            sid = req.params['sid']; // Aquired Session recording ID
            assert(sid && sid.length > 0, 'Missing recording session ID');
        } catch (e) {
            res.status(400).send('Invalid Request: ' + e.message);
            return;
        }

        try {
            const rec = await AgoraRecordingService.endRecording(sid);
            if (!rec) {
                res.status(404).send(`Unknown recording sid: "${sid}`);
            } else {
                res.status(200).json({
                    success: true,
                    resourceId: rec.resourceId,
                    recording: rec,
                    sid: rec.sid,
                });
            }
        } catch (err) {
            res.status(500).send('Internal server error:' + err.message);
        }
    };

    /**
     * Get information about an Agora Recording
     * @param req HTTP Request
     * @param res HTTP Respojse
     */
    public static apiGetRecording = async (req: Request, res: Response) => {
        let sid = '';

        try {
            sid = req.params['sid']; // Aquired Session recording ID
            assert(sid && sid.length > 0, 'Missing recording session ID');
        } catch (e) {
            res.status(400).send('Invalid Request: ' + e.message);
            return;
        }

        try {
            const resp = await AgoraRecordingService.getRecording(sid);
            resp.success = true;
            res.status(200).json(resp);
        } catch (err) {
            if (
                err.response &&
                err.response.status &&
                err.response.status == 404
            ) {
                res.status(404).send(`Recording with sid ${sid} not found`);
            } else {
                log.error(`(apiGetRecording) ERROR: ${err}`);
                res.status(500).send(`Internal server error: ${err}`);
            }
        }
    };

    /**
     * End Agora cloud recording
     * @param req HTTP Request
     * @param res HTTP Respojse
     */
    public static apiGetRecordingsForChannel = (
        req: Request,
        res: Response
    ) => {
        let channel = '';
        let onlyActive = false,
            callbacks = false;
        try {
            channel = req.params['channel'];
            assert(channel && channel.length > 0, 'Missing channel ID');
            onlyActive = req.query.onlyActive
                ? req.query.onlyActive.toString().toLowerCase() === 'true'
                : false;
            callbacks = req.query.callbacks
                ? req.query.callbacks.toString().toLowerCase() === 'true'
                : false;
        } catch (e) {
            res.status(400).send('Invalid Request: ' + e.message);
            return;
        }

        try {
            const results: AgoraRecording[] =
                AgoraRecordingService.getRecordingsForChannel(
                    channel,
                    onlyActive
                );
            if (!callbacks) {
                // if we don't want callback payloads, create copy of objects without callback payloads
                const rs: AgoraRecording[] = [];
                for (const r of results) {
                    const tmp = {};
                    Object.assign(tmp, r);
                    if (!callbacks) {
                        // @ts-ignore
                        delete tmp.callbackPayloads;
                    }
                    rs.push(tmp as AgoraRecording);
                }
                res.status(200).json({
                    success: true,
                    recordings: rs,
                });
            } else {
                res.status(200).json({
                    success: true,
                    recordings: results,
                });
            }
        } catch (err) {
            res.status(500).send('Internal server error:' + err.message);
        }
    };

    /**
     * Get all recordings stored in db
     * @param req
     * @param res
     */
    public static apiGetAllRecordings = async (req: Request, res: Response) => {
        try {
            const recordingFiles =
                await AgoraRecordingService.getAllRecordingFiles();
            if (recordingFiles) {
                res.status(200).json(recordingFiles);
            } else {
                res.status(404).send('Recordings not found');
            }
        } catch (err) {
            res.status(500).send('Internal server error:' + err.message);
        }
    };

    /**
     * Get all recording files for a specified acronym
     * @param req
     * @param res
     */
    public static apiGetRecordingFilesForSessionAcronym = async (
        req: Request<{ acronym: string }>,
        res: Response
    ) => {
        const { acronym } = req.params;
        try {
            const recordingFiles =
                await AgoraRecordingService.getRecordingFilesForSession(
                    acronym
                );
            if (recordingFiles) {
                res.status(200).json(recordingFiles);
            } else {
                res.status(404).send('Recordings not found');
            }
        } catch (err) {
            res.status(500).send('Internal server error:' + err.message);
        }
    };

    /**
     * Get all recording files for a specified sid (agora session)
     * @param req
     * @param res
     */
    public static apiGetRecordingFilesForSID = async (
        req: Request<{ sid: string }>,
        res: Response
    ) => {
        const { sid } = req.params;
        try {
            const recordingFiles =
                await AgoraRecordingService.getRecordingFilesForSID(sid);
            if (recordingFiles) {
                res.status(200).json(recordingFiles);
            } else {
                res.status(404).send('Recordings not found');
            }
        } catch (err) {
            res.status(500).send('Internal server error:' + err.message);
        }
    };

    /**
     * Handle a callback/notification from Agora
     * @param req
     * @param res
     */
    public static apiHandleAgoraCallback = async (
        req: Request,
        res: Response
    ) => {
        const payload: AgoraCallbackPayload = req.body;
        log.debug(
            `(apiHandleAgoraCallback) Payload: ${JSON.stringify(payload)}`
        );

        await AgoraRecordingService.handleAgoraCallback(payload);
        res.status(200).json({ success: true });
    };

    /**
     * Handle callback from AWS
     * @param req
     * @param res
     */
    public static apiHandleAWSCallback = async (
        req: Request<{}, {}, { sid: string; isEmpty: boolean }>,
        res: Response
    ) => {
        log.debug(`(apiHandleAWSCallback) Payload: ${req.body}`);

        const { sid, isEmpty } = req.body;

        const recording = await RecordingModel.findOne({
            sid,
        });

        if (recording) {
            if (isEmpty) {
                recording.state = RecordingState.Empty;
            } else {
                recording.state = RecordingState.Uploaded;
            }
            await recording.save();
        } else {
            log.warn(`Recording for sid "${sid}" not found`);
        }

        res.status(200).json({ success: true });
    };
}
