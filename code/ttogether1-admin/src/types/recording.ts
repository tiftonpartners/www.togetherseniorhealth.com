import { ICollectionDTO } from './dto';

export enum RecordingState {
    Ongoing = 'Ongoing',
    Completed = 'Completed',
    Uploaded = 'Uploaded',
    Empty = 'Empty'
}
export interface IRecording {
    sid?: string; // unique id from agora
    state?: RecordingState;
    acronym?: string; // session acronym
    date?: string; // formatted date from when recorded, used for folder path
    createdOn?: Date;
    startTime?: string;
    endTime?: string;
    duration?: number;
    tz?: string;
}
export interface IRecordingFile {
    fileName: string;
    title: string;
    ext: string;
    size: number;
    sid: string; // agora sid
    expireTime: string; // Expiration time for the signedURI, ISO 8601
    signedURI: string; // URI for access to CloudFront, signed
    unsignedURI: string; // CloudFront URI, without signing.
    slices: Record<string, string>; // slices for this manifest, indexed by file name
    fileData: string; // file data to pass to video player
    metadata?: IRecording;
}

export interface IRecordingCollectionDTO
    extends ICollectionDTO<IRecordingFile> {}
