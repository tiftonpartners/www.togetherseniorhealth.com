// This is information about a recording session
// It records information about the session including its current state.
// It will run a thread that queries the session to ensure that it is still
// running.
//
// NOTE: The idea was to move this to a service worker, but that is on hold
//       for now.  This class is currenty not in use.
import {
    AgoraRecordingService,
    AgoraResponse,
} from './agora-recording.service';
import {
    AgoraCallbackPayload,
    FileList,
    RecordingEventType,
} from '../av/agora-callback.types';
import { Logger } from '../core/logger.service';
import AWS from 'aws-sdk';
import moment from 'moment';
import { RecordingModel, RecordingState } from '../db/recording.db';
import { PasswordlessService } from '../service/passwordless.service';
import { ClassSessionModel } from '../db/session.db';
import { ClassModel, ClassDoc } from '../db/class.db';
require('dotenv').config();
const _ = require('lodash');

const log = Logger.logger('AgoraRecordingService');

// Constants from environment variables.
const AccessKey = process.env.AWS_CLASS_RECORDING_ACCESS_KEY || '';
const AWSSecret = process.env.AWS_CLASS_RECORDING_SECRET || '';
const AWSRegion = process.env.AWS_CLASS_RECORDING_REGION;

AWS.config.update({
    accessKeyId: AccessKey,
    secretAccessKey: AWSSecret,
    region: AWSRegion,
});

// Create an SQS service object
const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
//       a large number of concurrent recordings.

export class AgoraRecording {
    resourceId = ''; // Resource ID returned when aquiring the resource
    sid = ''; // Session ID returned when starting the recording
    channel = ''; // Agora channel/together1 session name
    uid = 0; // Agora user number that requested the recording
    composite = true; // Composite (vs individual) mode
    aquired = 0; // Date/time the resource was aquired
    started = 0; // Date/time recording started
    ended = 0; // Date/time recording ended
    token = ''; // Agora token for calling the API

    callbackPayloads: AgoraCallbackPayload[] = []; // The history of callback payloads for this session

    // Construct a recording object before the channel is aquired
    constructor(
        channel: string,
        uid: number,
        composite: boolean,
        token: string
    ) {
        this.channel = channel;
        this.uid = uid;
        this.token = token;
        this.composite = composite;
    }

    get isCompleted(): boolean {
        return this.ended > 0;
    }

    get isInProgress(): boolean {
        return this.started > 0 && this.ended === 0;
    }

    async markAquired(resourceId: string) {
        if (this.aquired > 0) {
            return;
        }
        this.resourceId = resourceId;
        this.aquired = new Date().getTime();
    }

    // This is called everytime a payload comes in from the callback controller
    callbackHandler = async (payload: AgoraCallbackPayload) => {
        // Make sure that this callback is for this subscription
        const cname = _.get(payload, 'payload.cname');
        if (cname) {
            this.callbackPayloads.push(payload);

            if (payload.eventType === RecordingEventType.RecordingStarts) {
                const sid = payload.sid;

                const rec = AgoraRecordingService.findRecordingBySid(sid);

                if (!rec) {
                    log.error(
                        `(callbackHandler) No recording found for SID ${sid}`
                    );
                    return;
                }
                const date = moment.utc();

                const klass = (await ClassModel.findOne({
                    'sessions.acronym': cname,
                })) as ClassDoc;

                const recording = new RecordingModel({
                    sid,
                    resourceId: rec.resourceId,
                    state: RecordingState.Ongoing,
                    acronym: cname,
                    date: date.format('YYYY-MM-DD'),
                    startTime: date.toISOString(),
                    tz: klass?.sessions[0]?.tz,
                });

                await recording.save();
            } else if (
                payload.eventType === RecordingEventType.RecordingExits
            ) {
                const sid = payload.sid;

                const recording = await RecordingModel.findOne({
                    sid,
                });

                if (recording) {
                    const endTime = moment.utc();
                    recording.state = RecordingState.Completed;
                    recording.duration = endTime.diff(
                        moment.utc(recording.startTime),
                        'ms'
                    );
                    recording.endTime = endTime.toISOString();
                    await recording.save();
                } else {
                    log.error(`Recording for sid "${sid}" not found`);
                }
            } else if (
                payload.eventType === RecordingEventType.UploadAllFiles
            ) {
                // there may be muliple different sids if the recording was
                // stopped / started for a specific session
                // this event should get called multiple times in that case
                // and each sid with its files will be included in same folder
                const sid = payload.sid;
                // the m3u8 should be the last file uploaded. event should only has this file
                // in its file list at this point
                const file = _.get(
                    payload,
                    'payload.details.fileList[0]'
                ) as FileList;

                if (file) {
                    const date = moment(file.sliceStartTime);

                    // custom token for each callback when event is finished
                    const token =
                        await PasswordlessService.generateAWSJwtToken();

                    const params = {
                        MessageAttributes: {
                            RecordDate: {
                                DataType: 'String',
                                StringValue: date.format('YYYY-MM-DD'),
                            },
                            Acronym: {
                                DataType: 'String',
                                StringValue: cname,
                            },
                            SID: {
                                DataType: 'String',
                                StringValue: sid,
                            },
                            Token: {
                                DataType: 'String',
                                StringValue: token,
                            },
                        },
                        MessageBody: 'Copy files s3',
                        QueueUrl: process.env.AWS_RECORDING_QUEUE_URL || '',
                    };

                    SQS.sendMessage(params, function (err, data) {
                        if (err) {
                            log.warn(`(callbackHandler) Error: ${err}`);
                        }
                    });
                }
            } else {
                log.warn(
                    `[AgoraController] (apiHandleAgoraCallback) Nothing to do for this event type`
                );
            }
        }
    };

    // Start the session and register the handler to receive callback
    // payloads
    markStarted(sid: string) {
        if (this.started > 0) {
            return;
        }
        this.sid = sid;
        this.started = new Date().getTime();
    }

    // Tell Agora to stop the recording, and also clear the query polling
    markStopped() {
        if (this.ended > 0) {
            return;
        }
        this.ended = new Date().getTime();
    }
}
