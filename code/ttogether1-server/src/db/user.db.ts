/**
 * Mongoose Schema, Model and Typescript interface for
 * local information about a User
 *
 * See Schemas for comments describing the objects
 *
 */
require('dotenv').config();
import { ObjectId } from 'mongodb';
import mongoose, { Schema } from 'mongoose';
import { validateEmail, validatePhone } from './helpers';
const AutoIncrement = require('mongoose-sequence')(mongoose);

export interface AgoraUser extends mongoose.Document {
    userId: string;
    userNumber: number;
    createdOn: Date;
    deleted?: boolean;
}

/**
 * Additional information that we need to remember about a user
 */
export const AgoraUserSchema = new Schema({
    userId: String, // Auth0 user ID
    userNumber: Number, // Numeric number, assigned for Agor0
    createdOn: { type: Date, default: Date.now }, // When the User record was first created
    deleted: Boolean,
});
AgoraUserSchema.index({ userId: 1 });

// For information about this plugin, see
// https://github.com/ramiel/mongoose-sequence
// https://docs.mongodb.com/v3.0/tutorial/create-an-auto-incrementing-field/
AgoraUserSchema.plugin(AutoIncrement, {
    inc_field: 'userNumber',
    start_seq: 100,
    disable_hooks: true,
});

export enum UserType {
    Prospect = 'ProspectUser',
    Participant = 'ParticipantUser',
}

export const userTypes = new Map<UserType, string>([
    [UserType.Prospect, 'ProspectUser'],
    [UserType.Participant, 'ParticipantUser'],
]);

export enum UserState {
    InProgress = 'In Progress',
    Closed = 'Closed',
    NotYetAssigned = 'Not Yet Assigned',
    Assigned = 'Assigned',
}

export const userStates = new Map<UserState, string>([
    [UserState.InProgress, 'In Progress'],
    [UserState.Closed, 'Closed'],
    [UserState.NotYetAssigned, 'Not Yet Assigned'],
    [UserState.Assigned, 'Assigned'],
]);

export enum IneligibilityReason {
    CognitiveStatus = 'Cognitive Status',
    NoCaregiver = 'No Caregiver',
    InadequateTechnology = 'Inadequate Technology',
    PhysicalLimitations = 'Physical Limitations',
    BehavorialStatus = 'Behavioral Status',
    OnHold = 'On Hold',
    Declined = 'Declined',
}
export const userIneligibilityReason = new Map<IneligibilityReason, string>([
    [IneligibilityReason.CognitiveStatus, 'Cognitive Status'],
    [IneligibilityReason.NoCaregiver, 'No Caregiver'],
    [IneligibilityReason.InadequateTechnology, 'Inadequate Technology'],
    [IneligibilityReason.PhysicalLimitations, 'Physical Limitations'],
    [IneligibilityReason.BehavorialStatus, 'Behavioral Status'],
    [IneligibilityReason.OnHold, 'On Hold'],
    [IneligibilityReason.Declined, 'Declined'],
]);

export enum WithdrawnReason {
    ChangeHealthStatus = 'Change in health status',
    ChangeCareState = 'Change in care status',
    OnHold = 'On Hold',
    Declined = 'Declined',
}

export const userWithdrawnReason = new Map<WithdrawnReason, string>([
    [WithdrawnReason.ChangeHealthStatus, 'Change in health status'],
    [WithdrawnReason.ChangeCareState, 'Change in care status'],
    [WithdrawnReason.OnHold, 'On Hold'],
    [WithdrawnReason.Declined, 'Declined'],
]);

export enum UserContactMethod {
    Email = 'Email',
    Phone = 'Phone',
}

export const userContactMethods = new Map<UserContactMethod, string>([
    [UserContactMethod.Email, 'Email'],
    [UserContactMethod.Phone, 'Phone'],
]);

export interface AVUser {
    __t?: string;
    userId: string;
    createdOn?: Date;
    ticket?: string;
    deleted?: boolean;
    firstName: string;
    lastName: string;
    screenName: string;
    email: string;
    disableClassEmails?: boolean;
    primaryPhone: string;
    mobilePhone: string;
    contactMethod?: UserContactMethod;
    streetAddress?: string;
    city?: string;
    zipCode?: string;
    tz?: string;

    sid: string;
    pidn?: string;
    caregiverFirstName?: string;
    caregiverLastName?: string;
    caregiverEmail?: string;
    disableCaregiverClassEmails?: boolean;
    caregiverPhone?: string;
    caregiverMobilePhone?: string;
    caregiverContactMethod?: UserContactMethod;
    caregiverStreetAddress?: string;
    caregiverCity?: string;
    caregiverZipCode?: string;
    caregiverRel?: string;
    courseInterest: string;

    localEmergencyPhone?: string;
    primaryEmergencyPhone?: string;
    secondaryEmergencyPhone?: string;
    referredBy?: string;
    communication?: string;
    notes?: string;

    program: string; // acronym of program in programs table
    state?: UserState;
    outcome?: IneligibilityReason | WithdrawnReason;
}

export interface AVUserDoc extends AVUser, mongoose.Document {}

export const AVUserSchema = new Schema<AVUserDoc>({
    userId: { type: String, trim: true, unique: true }, // Auth0 user ID
    memberId: { type: String, nullable: true },
    sid: { type: String, unique: true, trim: true, required: true },
    pidn: { type: String, trim: true },
    createdOn: { type: Date, default: Date.now }, // When the User record was first created
    ticket: { type: String, trim: true },
    deleted: Boolean,
    firstName: { type: String, trim: true, required: true, maxlength: 24 },
    lastName: { type: String, trim: true, required: true, maxlength: 24 },
    screenName: { type: String, trim: true, required: true, maxlength: 100 },
    email: {
        type: String,
        trim: true,
        required: true,
        validate: [validateEmail, 'Please fill a valid email address'],
        maxlength: 100,
    },
    disableClassEmails: {
        type: Boolean,
        default: false,
    },
    primaryPhone: {
        type: String,
        trim: true,
        required: true,
        validate: [validatePhone, 'Please fill a valid phone number'],
        maxlength: 20,
    },
    mobilePhone: {
        type: String,
        trim: true,
        required: true,
        validate: [validatePhone, 'Please fill a valid phone number'],
        maxlength: 20,
    },
    contactMethod: { type: String, maxlength: 50 },

    streetAddress: { type: String, maxlength: 50 },
    city: { type: String, maxlength: 50 },
    zipCode: { type: String, maxlength: 10 },
    tz: { type: String, default: 'America/Los_Angeles' },

    caregiverFirstName: { type: String, trim: true, max: 24 },
    caregiverLastName: { type: String, trim: true, max: 24 },
    caregiverEmail: {
        type: String,
        trim: true,
        maxlength: 100,
    },
    disableCaregiverClassEmails: {
        type: Boolean,
        default: false,
    },
    caregiverPhone: {
        type: String,
        trim: true,
        maxlength: 20,
    },
    caregiverMobilePhone: {
        type: String,
        trim: true,
        maxlength: 20,
    },
    caregiverContactMethod: { type: String, maxlength: 50 },
    caregiverStreetAddress: { type: String, maxlength: 50 },
    caregiverCity: { type: String, maxlength: 50 },
    caregiverZipCode: { type: String, maxlength: 10 },
    caregiverRel: { type: String, trim: true, maxlength: 50 },
    localEmergencyPhone: {
        type: String,
        trim: true,
        maxlength: 20,
    },
    primaryEmergencyPhone: {
        type: String,
        trim: true,
        maxlength: 20,
    },
    secondaryEmergencyPhone: {
        type: String,
        trim: true,
        maxlength: 20,
    },
    referredBy: { type: String, maxlength: 50 },
    communication: { type: String, maxlength: 50 },
    notes: { type: String, maxlength: 255 },
    program: { type: String, trim: true, required: true, default: 'OTHER' },
    state: {
        type: String,
        trim: true,
        required: true,
        default: UserState.InProgress,
    },
    outcome: {
        type: String,
        trim: true,
    },
});

export const AgoraUserModel = mongoose.model<AgoraUser>(
    'agora-user',
    AgoraUserSchema,
    'agora-users'
);

// LEGACY: ONLY USED TO MIGRATE DATA FOR NOW
export const UserLegacyModel = mongoose.model<AgoraUser>(
    'user',
    AgoraUserSchema
);

export const AVUserModel = mongoose.model<AVUserDoc>(
    'av-user',
    AVUserSchema,
    'av-users'
);

export interface ProspectUser extends AVUser {}
export interface ProspectUserDoc extends AVUserDoc {}

export const ProspectUserSchema = new Schema<ProspectUserDoc>({});
ProspectUserSchema.index({ userId: 1 });

// LEGACY: ONLY USED TO MIGRATE DATA FOR NOW
export const ProspectLegacyModel = mongoose.model<ProspectUserDoc>(
    'prospect',
    AVUserSchema,
    'prospects'
);

export const ProspectUserModel = AVUserModel.discriminator<ProspectUserDoc>(
    UserType.Prospect,
    // @ts-ignore
    ProspectUserSchema
);

export interface ParticipantUser extends AVUser {}
export interface ParticipantUserDoc extends AVUserDoc {}

export const ParticipantUserSchema = new Schema<ParticipantUserDoc>({});
ParticipantUserSchema.index({ userId: 1 });

export const ParticipantUserModel =
    AVUserModel.discriminator<ParticipantUserDoc>(
        UserType.Participant,
        // @ts-ignore
        ParticipantUserSchema
    );
