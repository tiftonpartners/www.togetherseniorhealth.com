/**
 * Mongoose Schemas, Models, and Typescript Interfaces
 * to record Session attandance
 *
 * See Schemas for comments describing the objects
 *
 */
import { ObjectId } from 'mongodb';
let moment = require('moment-timezone');
require('moment-recur');
import { extendMoment } from 'moment-range';
require('dotenv').config();
import mongoose, { Schema } from 'mongoose';

moment = extendMoment(moment);

/**
 * An Attendance is a record of a user's attandance in a particular
 * class session.
 */
var AttendanceSchema = new Schema({
    userId: String, // Auth0 ID of the user (instructor or participant)
    classId: String, // ID of the class object
    sessionAcronym: String, // Acronym of the session joined (globally unique across all classes)
    joined: { type: Date, default: Date.now }, // When the user joined (date/time)
});

export interface Attendance extends mongoose.Document {
    userId: string;
    classId: string;
    sessionAcronym: string;
    joined: Date;
}

export const AttendanceModel = mongoose.model('attendance', AttendanceSchema);

/**
 * This class exposes static methods for any operations that aren't done
 * directly with the Model/Document
 */
export class AttendanceService {
    public static async recordAttendance({
        userId,
        classId,
        sessionAcronym,
        joined,
    }: {
        userId: string;
        classId: string;
        sessionAcronym: string;
        joined?: Date;
    }) {
        const vals: any = {
            userId: userId,
            classId: classId,
            sessionAcronym: sessionAcronym,
            joined: joined || new Date(),
        };
        return AttendanceModel.findOneAndUpdate(
            {
                userId: userId,
                classId: classId,
                sessionAcronym: sessionAcronym,
            }, // filter
            vals, // update
            {
                new: true,
                upsert: true,
                rawResult: true,
                useFindAndModify: false,
            }
        );
    }
}
