/**
 * Service and types to control Agora cloud recording in composite
 * and individual modes
 */

require('dotenv').config();
import axios, { AxiosInstance } from 'axios';
import {
    S3Client,
    ListObjectsCommand,
    CopyObjectCommand,
    _Object,
} from '@aws-sdk/client-s3';
import { Logger } from '../core/logger.service';
import { AgoraRecording } from './agora-recording';
import { AgoraClientService } from '../av/agora-client.service';
import { AgoraCallbackPayload } from '../av/agora-callback.types';
import {
    RecordingDoc,
    RecordingModel,
    RecordingState,
} from '../db/recording.db';
import _ from 'lodash';
import Axios from 'axios';
import { ErrorCode } from '../db/helpers';
import { AdHocSessionModel } from '../db/session.db';
import { SessionStateService } from './session-state.service';
const fs = require('fs');
const path = require('path');
var cfsign = require('aws-cloudfront-sign');

const log = Logger.logger('AgoraRecordingService');

// The user ID used to initiate recording doesn't have to be a user
// in one of the streams, so we are using specific IDs
// IDs assigned to actual users start at 100, so these will not
// overlap
const COMPOSITE_RECORDING_UID = 10;
const INDIVIDUAL_RECORDING_UID = 11;

export const apiConfig = {
    returnRejectedPromiseOnError: true,
    withCredentials: true,
    timeout: 30000,
    baseURL: 'https://api.agora.io/v1',
    responseType: 'json',
    headers: {
        common: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    },
};

export interface AgoraRestAuth {
    username: string;
    password: string;
}

/**
 * Full set of information about a recording session
 */
export interface AgoraResponse {
    resourceId: string;
    sid: string;
    serverResponse: AgoraServerResponse;
}

/**
 * Detailed recording file information
 */
export interface RecordingFileInfo {
    filename: string;
    trackType: string; // "audio_and_video",
    uid: number; // Useris ID
    mixedAllUser: boolean;
    isPlayable: true;
    sliceStartTime: number; // Date/time
}

/**
 * Server response
 */
export interface AgoraServerResponse {
    fileListMode: string; // 'string' if fileList is a string, or 'json' if fileList is an array
    fileList: string | RecordingFileInfo[];
    uploadingStatus: string; // e.g. 'uploaded'
}

const auth: AgoraRestAuth = {
    username: process.env.AGORA_REST_AUTH_USERNAME as string,
    password: process.env.AGORA_REST_AUTH_PASSWORD as string,
};

const apiClient: AxiosInstance = axios.create({
    baseURL: 'https://api.agora.io/v1',
    responseType: 'json',
    auth: auth,
    headers: {
        'Content-Type': 'application/json',
    },
});

const appId = process.env.AGORA_APP_ID as string;
const recordings: AgoraRecording[] = []; // List of all recordingss made, both active and completed
// @ts-ignore
const recordingEnabled: boolean =
    (process.env.AGORA_RECORDING_ENABLED || 'false') === 'true';
log.info(
    `Agora Session Recording is ${recordingEnabled ? 'ENABLED' : 'DISABLED'}`
);

const AccessKey = process.env.AWS_CLASS_RECORDING_ACCESS_KEY || '';
const Secret = process.env.AWS_CLASS_RECORDING_SECRET || '';
const Bucket = process.env.AWS_CLASS_RECORDING_BUCKET;
const Region = process.env.AWS_CLASS_RECORDING_REGION;
const KeyID = process.env.AWS_CLOUDFRONT_KEY_ID;
const UrlPrefix = process.env.AWS_CLOUDFRONT_RECORDING_PREFIX;
const ExpiresMins = Number(process.env.AWS_CLOUDFRONT_RECORDING_EXPIRES_MINS);
const SecretKeyFile = process.env.AWS_CLOUDFRONT_SECRET_KEY; // Could be an actual PEM key, or the name of local key file.

const s3 = new S3Client({
    region: Region,
    credentials: { accessKeyId: AccessKey, secretAccessKey: Secret },
});

// The environment might contain the name of a local
// key file, in which case we read the contents.  Otherwise,
// the key is in the environment
let SecretKey = SecretKeyFile;
if (fs.existsSync(SecretKeyFile)) {
    log.debug(`Reading local Cloundfront key from file ${SecretKeyFile}`);
    SecretKey = fs.readFileSync(SecretKeyFile, 'utf8');
} else {
    log.debug('Got Cloudfront key from environment');
}

/**
 * Information about a recording file, including its Signed URI for
 * access via CloudFront. This can represents a manifest file with the
 * slices assigned as children.
 */
export class RecordingFile {
    fileName = '';
    title = '';
    ext = '';
    size = 0;
    sid = ''; // agora sid
    expireTime = ''; // Expiration time for the signedURI, ISO 8601
    signedURI = ''; // URI for access to CloudFront, signed
    unsignedURI = ''; // CloudFront URI, without signing.
    slices: Record<string, string> = {}; // slices for this manifest, indexed by file name
    fileData: string = ''; // file data to pass to video player
    metadata: RecordingDoc;

    /**
     * Construct song object from S3 object.  Its signedURI will be calculated
     * to expire as determined by ExpiresMins
     * @param s3ObjectInfo Information about an S3 object, returned from ListObjectsCommand
     */
    constructor(s3ObjectInfo: any, doc: RecordingDoc) {
        const f = path.parse(s3ObjectInfo.Key);
        this.fileName = s3ObjectInfo.Key;
        this.ext = f.ext;
        this.title = f.name;
        this.size = s3ObjectInfo.Size;
        this.metadata = doc;
        const split = this.title.split('_');

        if (split && split.length > 0) {
            this.sid = split[0];
        }
        this.extendSignedURI();
    }

    assignSlices(slices: Record<string, string>) {
        this.slices = slices;
    }

    assignFileData(data: string) {
        this.fileData = data;
    }

    /**
     * Extend the expiration time of the signed URI
     */
    extendSignedURI() {
        const expireTime = new Date().getTime() + 1000 * 60 * ExpiresMins;
        this.expireTime = new Date(expireTime).toISOString();
        const signingParams = {
            keypairId: KeyID,
            privateKeyString: SecretKey,
            // Optional - this can be used as an alternative to privateKeyString
            // privateKeyPath: SecretKey,
            expireTime: expireTime,
        };
        this.unsignedURI = encodeURI(
            'https://' + UrlPrefix + '/' + this.fileName
        );
        this.signedURI = cfsign.getSignedUrl(
            // Note: This is confusing.  If the URI contains characters that
            // need URI encoding, the returned signed URI will be encoded,
            // but the signature will not match.
            this.unsignedURI,
            signingParams
        );
    }
}
/**
 * Service to invoke Agora REST APIs for recording
 */
export class AgoraRecordingService {
    /**
     * Aquire a resource ID for recording.  The resource is associated
     * with the combination of channel & user.  Note that multiple simultaneous recordings
     * are possible, but they must start by aquiring the channel with a different user.
     * @param channel
     * @param uid
     * @returns A string that identifies the aquired resource
     */
    static async acquireResource(
        channel: string,
        uid: number
    ): Promise<string> {
        if (!recordingEnabled) {
            log.debug('(acquireResource) Agora Recording is Disabled');
            return Promise.resolve('');
        }
        const req = {
            cname: channel,
            uid: uid.toString(),
            clientRequest: {},
        };
        return apiClient
            .post<any>(`/apps/${appId}/cloud_recording/acquire`, req)
            .then((response) => {
                return response.data?.resourceId;
            })
            .catch((error) => {
                const msg = `ERROR acquiring Agora recording resource:"${error.message}" appId:${appId} channel:${channel} uid:${uid}`;
                log.error('(acquireResource)' + msg);
                throw new Error(msg);
            });
    }

    /**
     * Start an Agora cloud recording
     * @param channel
     * @param uid
     * @param resourceId
     * @param token
     * @param composite
     * @return A string representing the resource ID associated with the recording.  Use this to query + stop the recording
     */
    static async startRecording(
        channel: string,
        uid: number,
        resourceId: string,
        token: string,
        composite: boolean = true
    ): Promise<string> {
        if (!recordingEnabled) {
            log.debug('(startRecording) Agora Recording is Disabled');
            return Promise.resolve('');
        }
        const storageConfig = {
            vendor: parseInt(process.env.AGORA_STORAGE_CLOUD_VENDOR as string),
            region: parseInt(process.env.AGORA_STORAGE_CLOUD_REGION as string),
            bucket: process.env.AGORA_STORAGE_CLOUD_BUCKET as string,
            accessKey: process.env.AGORA_STORAGE_CLOUD_ACCESS_KEY as string,
            secretKey: process.env.AGORA_STORAGE_CLOUD_SECRET_KEY as string,
        };
        const req = {
            cname: channel,
            uid: uid.toString(),
            clientRequest: {
                token: token,
                recordingConfig: {
                    maxIdleTime: 120,
                    transcodingConfig: {
                        width: 640,
                        height: 360,
                        fps: 30,
                        bitrate: 600,
                        mixedVideoLayout: 1,
                    },
                },
                storageConfig: storageConfig,
            },
        };
        if (!composite) {
            // In individual mode, transcodingConfig must be omitted
            // @ts-ignore
            delete req.clientRequest.recordingConfig.transcodingConfig;
            // Note: The next parameter is described as "The estimated maximum number of subscribed users"
            //       A value of 1 corresponds to 3-7 UIDs.  It is not clear if we need to
            //       set this accurately depending on the actual number of users
            // @ts-ignore
            req.clientRequest.recordingConfig.subscribeUidGroup = 0;
        }
        const mode = composite ? 'mix' : 'individual';
        return apiClient
            .post<any>(
                `/apps/${appId}/cloud_recording/resourceid/${resourceId}/mode/${mode}/start`,
                req
            )
            .then((response) => {
                return response.data?.sid;
            });
    }

    /**
     * Stop Agora cloud recording
     * @param channel
     * @param uid
     * @param resourceId
     * @param sid
     * @param composite
     * @returns The full response from Agora
     */
    static async stopRecording(
        channel: string,
        uid: number,
        resourceId: string,
        sid: string,
        composite: boolean = true
    ): Promise<AgoraResponse | undefined> {
        if (!recordingEnabled) {
            log.debug('(stopRecording) Agora Recording is Disabled');
            return Promise.resolve(undefined);
        }

        const req = {
            cname: channel,
            uid: uid.toString(),
            clientRequest: {},
        };
        const mode = composite ? 'mix' : 'individual';
        return apiClient
            .post<any>(
                `/apps/${appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/${mode}/stop`,
                req
            )
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                log.error(
                    'Error stopping Agora recording:' +
                        error.response.data.code || error.response.data
                );
                const keys: string[] = [];
                for (var key in error) {
                    keys.push(key);
                }
                log.error(`Error Keys: ${keys}`);
                throw error;
            });
    }

    /**
     * Query the current status of an ongoing Agora cloud recording
     * @param resourceId
     * @param sid
     * @param composite
     * @returns The full response from Agora
     */
    static async queryRecording(
        resourceId: string,
        sid: string,
        composite: boolean = true
    ): Promise<AgoraResponse | undefined> {
        if (!recordingEnabled) {
            log.debug('(queryRecording) Agora Recording is Disabled');
            return Promise.resolve(undefined);
        }

        const mode = composite ? 'mix' : 'individual';
        return apiClient
            .get<any>(
                `/apps/${appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/${mode}/query`
            )
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                throw error;
            });
    }

    /**
     * Higher Level Methods that work with AgoraRecording objects
     */

    /**
     * Get the Uid to use when calling recording functions
     *
     * @param composite Composite or individual mode?
     */
    private static getRecordingUid(composite: boolean) {
        return composite ? COMPOSITE_RECORDING_UID : INDIVIDUAL_RECORDING_UID;
    }

    /**
     * Find recording given its SID
     *
     * @param sid Unique identifier for the recording (created when the recording is started)
     * @returns The recording, if found, or null otherwise
     */
    static findRecordingBySid(sid: string): AgoraRecording | null {
        for (const recording of recordings) {
            if (recording.sid === sid) {
                return recording;
            }
        }
        return null;
    }

    /**
     * Create a new recording object and remember it for future lookup
     */
    static newRecording(
        channel: string,
        uid: number,
        composit: boolean,
        token: string
    ): AgoraRecording {
        const rec = new AgoraRecording(channel, uid, composit, token);
        recordings.push(rec);
        return rec;
    }

    /**
     * Start a new Agora recording including aquiring the resource and
     * starting the session
     * @param recording An existing Agora Recording object
     * @returns The sid of the recording
     */
    static async beginRecording(
        channel: string,
        composite: boolean
    ): Promise<string> {
        if (!recordingEnabled) {
            log.debug('(beginRecording) Agora Recording is Disabled');
            return Promise.resolve('');
        }

        try {
            const uid = this.getRecordingUid(composite);
            let token = AgoraClientService.getChannelUserToken(channel, uid);
            const recording = new AgoraRecording(
                channel,
                uid,
                composite,
                token
            );
            recordings.push(recording);
            log.debug(
                `(beginRecording) Getting resource channel:${channel} uid:${uid} token:${token}`
            );
            const resourceId = await this.acquireResource(channel, uid);
            recording.markAquired(resourceId);
            const sid = await this.startRecording(
                channel,
                uid,
                resourceId,
                token,
                composite
            );
            recording.markStarted(sid);
            return sid;
        } catch (e) {
            log.error(`(beginRecording) ERROR Could not start recording: ${e}`);
        }
        return '';
    }

    /**
     * Recreate an Agora recording
     * @param recording An existing Agora Recording object
     * @returns The sid of the recording
     */
    static async recreateRecording(
        channel: string,
        sid: string,
        resourceId: string,
        composite: boolean
    ): Promise<void> {
        if (!recordingEnabled) {
            log.debug('(recreateRecording) Agora Recording is Disabled');
            return Promise.resolve();
        }

        try {
            const uid = this.getRecordingUid(composite);
            let token = AgoraClientService.getChannelUserToken(channel, uid);
            const recording = new AgoraRecording(
                channel,
                uid,
                composite,
                token
            );
            recordings.push(recording);
            log.debug(
                `(recreateRecording) Recreated recording object for sid ${sid}`
            );
            await recording.markAquired(resourceId);
            recording.markStarted(sid);
        } catch (e) {
            log.error(
                `(recreateRecording) ERROR Could not recreate recording: ${e}`
            );
        }
        return;
    }

    /**
     * End an existing recording.
     * If the recording is not in the active state, it will do nothing.
     * It will return null if the recording cannot be found.
     *
     * @param sid Unique identifier of the recording.
     * @returns The recording record for the recording
     */
    static async endRecording(
        sid: string
    ): Promise<AgoraRecording | undefined> {
        log.debug(`(endRecording) Agora Recording: ${recordingEnabled}`);
        if (!recordingEnabled) {
            log.debug('(endRecording) Agora Recording is Disabled');
            return undefined;
        }

        const rec = this.findRecordingBySid(sid);
        if (!rec) {
            return undefined;
        }
        if (!rec.isInProgress) {
            return Promise.resolve(rec);
        }
        const resp = await this.stopRecording(
            rec.channel,
            rec.uid,
            rec.resourceId,
            sid,
            rec.composite
        );
        rec.markStopped();
        return rec;
    }

    /**
     * Get information about a recording
     *
     * @param sid Unique identifier of the recording.
     * @returns The recording record.  If the recording is in progress,
     * also returns the recording status from Agora
     */
    static async getRecording(sid: string): Promise<any | null> {
        const rec = this.findRecordingBySid(sid);
        if (!rec) {
            return null;
        }
        const result = { recording: rec, agora: null };
        if (recordingEnabled && rec.isInProgress) {
            try {
                const resp = await this.queryRecording(
                    rec.resourceId,
                    sid,
                    rec.composite
                );
                // @ts-ignore
                result.agora = resp;
            } catch (e) {
                // Ignore errors for now
            }
        }
        return result;
    }

    /**
     * Get information about recordings for a channel
     *
     * @param channel Channel of interest
     * @param onlyActive Set to true to get only currently active recordings
     * @returns A list of recording objects
     */
    static getRecordingsForChannel(
        channel: string,
        onlyActive: boolean = false
    ): AgoraRecording[] {
        const results: AgoraRecording[] = [];
        for (const recording of recordings) {
            log.debug(`(getRecordingsForChannel) onlyActive: ${onlyActive}`);
            if (
                recording.channel === channel &&
                (!onlyActive || (onlyActive && recording.isInProgress))
            ) {
                results.push(recording);
            }
        }
        return results;
    }

    /**
     * Handle callback with payload from Agora
     *
     * @param payload Payload from Agora
     */
    public static async handleAgoraCallback(payload: AgoraCallbackPayload) {
        const rec = this.findRecordingBySid(payload.sid);

        if (!rec) {
            log.warn(`Callback for undefined sid: ${payload.sid}`);
        } else {
            await rec.callbackHandler(payload);
        }
    }

    /**
     * Handle callback with payload from AWS after video files are copied
     *
     * @param payload Payload from Agora
     */
    public static async handleAWSCallback(payload: {
        sid: string;
        acronym: string;
        isEmpty?: boolean;
    }) {
        const rec = this.findRecordingBySid(payload.sid);

        // If there is still a recording for this sid, end it
        if (rec) {
            await this.endRecording(rec.sid);
        }

        // If the payload is empty (file is empty in AWS), there must be a idle session issue
        // Remove the session from state
        if (payload.isEmpty) {
            await SessionStateService.removeSessionByAcronym(payload.acronym);
        }
    }

    public static async getAllRecordingFiles(): Promise<RecordingDoc[]> {
        const records = await RecordingModel.aggregate([
            {
                $match: {
                    state: {
                        $ne: RecordingState.Empty,
                    },
                },
            },
            {
                $lookup: {
                    from: 'classes',
                    localField: 'acronym',
                    foreignField: 'sessions.acronym',
                    as: 'session',
                },
            },
            { $unwind: '$session' },
            { $unset: 'session' },
            { $sort: { date: -1 } },
        ]);

        return records;
    }

    public static async getRecordingFilesForSession(
        acronym: string
    ): Promise<RecordingFile[] | undefined> {
        const recordings = await RecordingModel.find({
            acronym,
        });

        if (!recordings) {
            throw new ErrorCode(`No recording found for acronym: ${acronym}`);
        }

        const recordingFiles = await AgoraRecordingService.getRecordingFiles(
            recordings
        );

        if (recordingFiles && recordingFiles.length > 0) {
            return recordingFiles;
        }

        return undefined;
    }

    public static async getRecordingFilesForSID(
        sid: string
    ): Promise<RecordingFile | undefined> {
        const recording = await RecordingModel.findOne({
            sid,
        });

        if (!recording) {
            throw new ErrorCode(`No recording found for SID: ${sid}`);
        }

        try {
            const recordingFiles =
                await AgoraRecordingService.getRecordingFiles([recording]);

            if (recordingFiles && recordingFiles.length > 0) {
                return recordingFiles[0];
            }
        } catch (e) {
            log.warn(`(getRecordingFilesForSID) failed: ${e}`);
            throw new Error(e);
        }

        return undefined;
    }

    private static async getRecordingFiles(
        recordings: RecordingDoc[]
    ): Promise<RecordingFile[]> {
        const $recordingFiles = recordings.map(async (recording) => {
            const obj = await s3.send(
                new ListObjectsCommand({
                    Bucket: Bucket,
                    Prefix: `${recording.date}/${recording.acronym}/${recording.sid}`,
                    Delimiter: '/',
                })
            );

            if (obj.Contents) {
                return obj.Contents.filter((o: _Object) => {
                    return o.Size && o.Size > 0;
                }).map((obj: any) => new RecordingFile(obj, recording));
            }
        });

        const recordingFiles = await Promise.all($recordingFiles);
        const recordingFilesFiltered = recordingFiles.filter(
            Boolean
        ) as RecordingFile[][];

        const recordingFilesReduced: RecordingFile[] =
            recordingFilesFiltered.reduce((prev, cur) => {
                prev.push(...cur);
                return prev;
            }, [] as RecordingFile[]);

        // Group by file extension, manifest files are high level records
        const recordingFilesGroupedByExt = _.groupBy(
            recordingFilesReduced,
            (file: RecordingFile) => {
                return file.ext;
            }
        );

        // Also group by sid
        const recordingFilesGroupedBySid = _.groupBy(
            recordingFilesGroupedByExt['.ts'],
            (file: RecordingFile) => {
                return file.sid;
            }
        );

        if (recordingFilesGroupedByExt['.m3u8']) {
            const manifestRecordingFiles = recordingFilesGroupedByExt[
                '.m3u8'
            ].map((recordingManifestFile) => {
                if (
                    recordingFilesGroupedBySid &&
                    recordingFilesGroupedBySid[recordingManifestFile.sid]
                ) {
                    const slices = recordingFilesGroupedBySid[
                        recordingManifestFile.sid
                    ].reduce((prev, cur) => {
                        prev[cur.title + cur.ext] = cur.signedURI;
                        return prev;
                    }, {} as Record<string, string>);

                    recordingManifestFile.assignSlices(slices);
                }

                return recordingManifestFile;
            });

            const $manifestRecordingFilesSigned = manifestRecordingFiles.map(
                async (file) => {
                    const response = await Axios.get(file.signedURI);
                    if (response && response.data) {
                        const fileData = response.data;
                        const lines: string[] = fileData.split('\n');

                        // If the manifest file record has a slice
                        // that corresponds to the content of the actual
                        // manifest file, then replace with the signed URI
                        const manifestSigned = lines.map((line) => {
                            return file.slices[line] || line;
                        });

                        file.assignFileData(manifestSigned.join('\n'));
                    }

                    return file;
                }
            );

            const manifestRecordingFilesSigned = await Promise.all(
                $manifestRecordingFilesSigned
            );

            return manifestRecordingFilesSigned;
        }

        return [];
    }
}
