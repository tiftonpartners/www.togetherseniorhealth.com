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

export type NotificationType = 'Email' | 'SMS';

export enum EmailType {
    DailyClassReminder = 'DailyClassReminder',
    TomorrowClassReminder = 'TomorrowClassReminder',
    UserClassReminder = 'UserClassReminder',
    RescheduledClassReminder = 'RescheduledClassReminder',

    DailyAdHocSessionReminder = 'DailyAdHocSessionReminder',
    TomorrowAdHocSessionReminder = 'TomorrowAdHocSessionReminder',
    UserAdHocSessionReminder = 'UserAdHocSessionReminder',
    MeetNowAdHocSessionReminder = 'MeetNowAdHocSessionReminder',
    RescheduledAdHocSessionReminder = 'RescheduledAdHocSessionReminder',
}

export enum EmailStatus {
    Pending = 'pending',
    Rejected = 'rejected',
    Sent = 'sent',
}

export enum EmailRejectedReason {
    Regex = 'Regex',
    AlreadyTried = 'AlreadyTried',
    AlreadySent = 'AlreadySent',
    APIError = 'APIError',
    ClassAcronym = 'ClassAcronym',
    ClassEmailsDisabled = 'ClassEmailsDisabled',
    UserEmailsDisabled = 'UserEmailsDisabled',
}

export interface EmailLedger extends mongoose.Document {
    emailId: string;
    batchId: string; // unique id based on specific batch of emails being sent
    createdOn: Date;
    emailType: EmailType;
    to: string;
    cgTo: string;
    bcc?: string;
    status: EmailStatus;
    rejectedReason?: EmailRejectedReason;
    rejectedMsg?: string;
    properties?: any; // Object to store info specific to email type
}

/**
 * A Course an offering of a particular product
 */
var EmailLedgerSchema = new Schema<EmailLedger>({
    batchId: String,
    emailId: String,
    createdOn: String,
    emailType: {
        type: String,
        enum: [
            'DailyClassReminder',
            'TomorrowClassReminder',
            'UserClassReminder',
            'RescheduledClassReminder',
            'DailyAdHocSessionReminder',
            'TomorrowAdHocSessionReminder',
            'UserAdHocSessionReminder',
            'MeetNowAdHocSessionReminder',
            'RescheduledAdHocSessionReminder',
        ],
    },
    status: {
        type: String,
        enum: ['pending', 'rejected', 'sent'],
        default: 'pending',
    },
    rejectedReason: {
        type: String,
        enum: [
            'Regex',
            'AlreadySent',
            'AlreadyTried',
            'APIError',
            'ClassAcronym',
            'UserEmailsDisabled',
        ],
    },
    rejectedMsg: String,
    to: String,
    bcc: String,
    properties: Object,
});

EmailLedgerSchema.index({ to: 1, emailType: 1 });

export const EmailLedgerModel = mongoose.model<EmailLedger>(
    'email-ledger',
    EmailLedgerSchema,
    'email-ledger'
);
