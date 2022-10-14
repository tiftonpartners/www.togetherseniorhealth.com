/**
 * These are event information received from Agora Recording callbacks.
 * Agora sends these via the callbacks
 *
 * A typical event looks like this:
 * @example
 * agoraCallback: {
 *     "noticeId": "31aeb35a9245cbd977cfe18b438b75ed",
 *     "notifyMs": 1596555306283,
 *     "eventType": 40,
 *     "sid": "d12fdce9024d37862a8f3a88e387c817",
 *     "payload": {
 *       "serviceType": 1,
 *       "uid": "1001",
 *       "sequence": 1,
 *       "sendts": 1596555306257,
 *       "cname": "Testing2",
 *       "details": {
 *         "status": 0,
 *         "msgName": "recorder_started"
 *       },
 *       "sid": "d12fdce9024d37862a8f3a88e387c817"
 *     },
 *     "productId": 3
 *   }
 *
 * Check out the Agora documentation at {@link https://docs.agora.io/en/cloud-recording/cloud_recording_callback_rest?platform=All%20Platforms}
 *
 * Sample event type sequence:
 * 40, 44, 43, 43, 44, 4, 4, 44, 43, 42, 44, 43, 41, 43, 44, 44, 11, 43, 31
 */
export interface AgoraCallbackPayload {
    noticeId: string;
    notifyMs: number;
    eventType: RecordingEventType;
    sid: string; // Unique identifier for this recording request
    payload: Payload;
    productId: number;
}

/**
 * The type of the event for the callback.
 */
export enum RecordingEventType {
    RecordingError = 0, // An error occurs during the recording.
    RecordingWarning = 1, // A warning occurs during the recording.
    RecordingStatusChange = 3, // The status of the Agora Cloud Recording service changes.
    PlaylistFileGenerated = 4, // The M3U8 playlist file is generated.
    RecordingExited = 11, // The cloud recording service has ended its tasks and exited.
    RecordingHAEnabled = 12, // The cloud recording service has enabled the high availability mechanism.
    UploadStarts = 30, // The upload service starts.
    UploadAllFiles = 31, // All the recorded files are uploaded to the specified third-party cloud storage.
    UploadBackedUp = 32, // All the recorded files are uploaded, but at least one file is uploaded to Agora Cloud Backup.
    UploadProgress = 33, // The progress of uploading the recorded files to the cloud storage.
    RecordingStarts = 40, // The recording starts.
    RecordingExits = 41, // The recording exits.
    RecordingSync = 42, // The recording service syncs the information of the recorded files.
    AudioStateChange = 43, // The state of the audio stream changes.
    VideoStateChange = 44, // The state of the video stream changes.
    ApsaraVideoStarted = 60, // The uploader for ApsaraVideo for VoD has started and successfully acquired the upload credential
    AsparaUploadComplete = 61, // All recorded files have been uploaded to ApsaraVideo for VoD.
}

/**
 * The Agora Recording Service associated with the callback
 */
export enum ServiceType {
    CloudRecording = 0, // Event types 1-12
    UploaderModule = 2, // Event types 30-33
    RecorderModule = 1, // Event types 40-44
    ExtensionService = 4, // Event types 60+
}

/**
 * Payload portion of Agora Callback data
 */
export interface Payload {
    serviceType: ServiceType;
    serviceScene?: string;
    uid: string; // User number of the user who initiated the recording
    sequence: number;
    sendts: number; // Date/timestamp
    cname: string; // Channel name, same as Together1 session name
    details: Details;
    sid: string; // Unique identifier for this recording request
}

/**
 * The details fields depends on the event type
 * This is a superset of the fields that I have see thus far
 */
export interface Details {
    msgName?: string; // Human readable version of event type; always present
    state?: number;
    utcMs?: number;
    exitStatus?: number;
    status?: number;
    streamUid?: string; // User Number of the user for a specific stream
    fileList?: FileList[]; // Filenames for stored media (not sure if there can be more than one like in the server response?)
    discontinueUtcMs?: number;
    mixedAllUser?: true; // Composite vs. individual mode?
    trackType?: string; // Audio; video; or both ("audio_and_video")
    leaveCode?: 24;
}

export interface FileList {
    isPlayable: boolean;
    uid: string;
    fileName: string;
    sliceStartTime: number;
    mixedAllUser: boolean;
    trackType: string;
}
