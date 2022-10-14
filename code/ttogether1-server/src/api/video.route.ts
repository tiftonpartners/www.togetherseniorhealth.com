/**
 * Router to send video API calls to the Agora controller
 */
import { Router } from 'express';
import { Logger } from '../core/logger.service';
import { AgoraController } from './agora.controller';
import permissions from './permissions.middleware';
const log = Logger.logger('VideoRouter');
// @ts-ignore:
export const videoRouter = new Router();
// We have a separate router for the callbacks - they do not require authentication.
// @ts-ignore:
export const agoraCallbackRouter = new Router();
try {
    videoRouter
        .route('/agora/token/:sessionId/:userNumber')
        .get(
            permissions('apiGetSessionUserToken'),
            AgoraController.apiGetSessionUserToken
        );
    videoRouter
        .route('/agora/token/:sessionId')
        .get(
            permissions('apiGetSessionUserToken'),
            AgoraController.apiGetSessionUserToken
        );
    videoRouter
        .route('/agora/adhoc-token/:sessionId')
        .get(
            permissions('apiGetAdhocSessionUserToken'),
            AgoraController.apiGetAdhocSessionUserToken
        );

    // Routes for Agora cloud recording
    agoraCallbackRouter
        .route('/agora/callback')
        .post(AgoraController.apiHandleAgoraCallback);
    videoRouter
        .route('/aws/callback')
        .post(
            permissions('apiHandleAWSCallback'),
            AgoraController.apiHandleAWSCallback
        );
    videoRouter
        .route('/agora/record/begin/:channel/:mode')
        .post(
            permissions('apiBeginRecording'),
            AgoraController.apiBeginRecording
        );
    videoRouter
        .route('/agora/record/end/:sid')
        .post(permissions('apiEndRecording'), AgoraController.apiEndRecording);
    videoRouter
        .route('/agora/record/get/:sid')
        .get(permissions('apiGetRecording'), AgoraController.apiGetRecording);
    videoRouter
        .route('/agora/recordings/get/all')
        .get(
            permissions('apiGetAllRecordings'),
            AgoraController.apiGetAllRecordings
        );
    videoRouter
        .route('/agora/recording-files/get/acronym/:acronym')
        .get(
            permissions('apiGetRecordingFilesForSessionAcronym'),
            AgoraController.apiGetRecordingFilesForSessionAcronym
        );
    videoRouter
        .route('/agora/recording-files/get/sid/:sid')
        .get(
            permissions('apiGetRecordingFilesForSID'),
            AgoraController.apiGetRecordingFilesForSID
        );
    videoRouter
        .route('/agora/record/channel/:channel')
        .get(
            permissions('apiGetRecordingsForChannel'),
            AgoraController.apiGetRecordingsForChannel
        );
} catch (e) {
    log.error(`Exception resolving session controller: ${e}`);
}
