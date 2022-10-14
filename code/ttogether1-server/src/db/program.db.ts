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
import mongoose, { Schema } from 'mongoose';

var ProgramSchema = new Schema<ProgramDoc>({
    acronym: {
        type: String,
        maxlength: 8,
        trim: true,
        unique: true,
        uppercase: true,
    },
    shortName: { type: String, maxlength: 30, unique: true, trim: true },
    longName: { type: String, maxlength: 100 },
    description: { type: String, maxlength: 200 },
    logoUrl: { type: String, maxlength: 200 },
    coordinatorName: { type: String, maxlength: 100 },
    coordinatorPhone: { type: String, maxlength: 20 },
    coordinatorEmail: { type: String, maxlength: 100 },
    createdOn: { type: Date, default: Date.now },
});

export interface Program {
    acronym: string;
    shortName: string;
    longName: string;
    description: string;
    logoUrl: string;
    coordinatorName: string;
    coordinatorPhone: string;
    coordinatorEmail: string;
    createdOn?: Date;
}

export interface ProgramDoc extends Program, mongoose.Document {}

export const ProgramModel = mongoose.model<ProgramDoc>(
    'program',
    ProgramSchema
);
