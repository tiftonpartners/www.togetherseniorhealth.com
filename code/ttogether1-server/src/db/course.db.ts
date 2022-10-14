/**
 * Mongoose Schemas, Models, and Typescript Interfaces
 * for Course, Class and Session data stored in
 * MongoDB
 *
 * See Interfaces for comments describing the objects
 *
 */
require('dotenv').config();
import { ObjectId } from 'mongodb';
import mongoose, { Schema } from 'mongoose';

/**
 * A Course an offering of a particular product
 */
var CourseSchema = new Schema<CourseDoc>({
    name: String,
    description: String,
    acronym: String, // Used to name resources related to this Course
    createdOn: { type: Date, default: Date.now }, // When the record was first created
    state: { type: String, enum: ['waitl', 'open', 'done'] }, // States: Waitlisting, OK for signup, Completed
    program: {
        type: String,
        trim: true,
        required: true,
        default: 'OTHER',
    },
    // Not implemented yet: expectedStart: { year: Number, month: Number, quarter: Number, season: String }, // About when we expect the class to start, if waitlisted
});

export const CourseModel = mongoose.model<CourseDoc>('course', CourseSchema);

/**
 * A course offering, such as "Moving Together - Standing"
 */
export interface Course {
    name: string;
    description: string;
    acronym: string;
    createdOn?: Date;
    state: 'waitl' | 'open' | 'done';
    program: string;
    // Not implemented yet: expectedStart: Timeframe | {}
}

export interface CourseDoc extends Course, mongoose.Document {}
