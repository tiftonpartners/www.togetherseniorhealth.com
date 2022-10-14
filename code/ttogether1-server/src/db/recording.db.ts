/**
 * Mongoose Schemas, Models, and Typescript Interfaces
 * for Program data stored in
 * MongoDB
 *
 * See Interfaces for comments describing the objects
 *
 */
require('moment-recur');
require('dotenv').config();
import moment from 'moment';
import mongoose, { Schema } from 'mongoose';

const RecordingSchema = new Schema<RecordingDoc>({
    sid: String,
    resourceId: String,
    state: String,
    acronym: String,
    date: String,
    createdOn: { type: Date, default: Date.now },
    startTime: String,
    endTime: String,
    duration: Number,
    tz: String,
});

export enum RecordingState {
    Ongoing = 'Ongoing',
    Completed = 'Completed',
    Uploaded = 'Uploaded',
    Empty = 'Empty',
    Exited = 'Exited',
}

export interface Recording {
    sid?: string; // unique id from agora
    resourceId?: string; // resource id from agora
    state?: RecordingState;
    acronym?: string; // session acronym
    date?: string; // formatted date from when recorded, used for folder path
    createdOn?: Date;
    startTime?: string;
    endTime?: string;
    duration?: number;
    tz?: string;

    recordingExited: () => void;
    setEndTime: () => void;
}

RecordingSchema.methods.recordingExited = function () {
    console.debug(
        `(recordingSchema) Setting recording state to 'Exited' for entry with SID ${this.sid}`
    );
    this.setEndTime();
    this.state = RecordingState.Exited;
};

RecordingSchema.methods.setEndTime = function () {
    const endTime = moment.utc();
    this.duration = endTime.diff(moment.utc(this.startTime), 'ms');
    this.endTime = endTime.toISOString();
    console.debug(
        `(recordingSchema) Setting end time for entry with SID ${this.sid} to ${this.endTime}`
    );
};

export interface RecordingDoc extends Recording, mongoose.Document {}

export const RecordingModel = mongoose.model<RecordingDoc>(
    'recording',
    RecordingSchema
);
