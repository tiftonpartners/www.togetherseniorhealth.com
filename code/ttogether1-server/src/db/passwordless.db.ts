require('dotenv').config();
import mongoose, { Schema } from 'mongoose';

// Constants for unused values
export const NO_VALUE = '-';

// Namespace for custom token fields in common with Auth0 tokens
export const CustomTokenNamespace = 'https://t1.tsh.com/';

/**
 * The different roles we may assume using passwordless login.
 * For now, the value correspond directly to the name of the
 * Auth0 role that defines the permissions that those roles get.
 *
 */
export enum PasswordlessRole {
    Prospect = 'pwdlessProspect', // A normal class participant
    User = 'pwdlessParticipant', // A normal class participant
    Preflight = 'pwdlessPreflight', // A preflight test
}

// Constants for ticket type, currently only user tickets are supported,
// but we might support others in the future
export enum TicketType {
    Prospect = 'prospect', // Prospect
    User = 'user', // User
    Session = 'ses', // Session
    Class = 'cls', // Cass
}

/**
 * Information about a Passwordless Ticket.  The ticket value is
 * usually passed along via a URL and then looked up in this table to
 * generate a signed JWT
 * with limited grants allowing the user to query and join sessions
 *
 * If no user or class session is specified, then this is an "anonymous" login,
 * and token doesn't have any identity in Auth0.  If an identity is specified,
 * then the user is expected to have an identity which will be verified.
 *
 * If a class/session is specified, then the user's access is further restricted to the
 * class and/or session specified.
 *
 */
var PasswordlessSchema = new Schema({
    randomTicket: String, // Random generated token
    ticketType: String, // Ticket type, see the TicketType enum for values
    createdOn: Date, // When was this entry created? Integer time msec
    expiresOn: Date, // When does this expire?  Integer time msec
    userId: String, // Auth0 ID of the user (user ticket only)
    nickname: String, // Optional human-friendly name of the user
    name: String, // Optional user's full name
    picture: String, // Optional, URL of user's picture
    externalId: String, // Any identifier to an external system
    classAcronym: String, // Optional cass acronym
    validMins: Number, // How long was it valid for
    role: String, // Autn0 role from which permissions are derived
});
PasswordlessSchema.index({ userId: 1 });

export interface Passwordless extends mongoose.Document {
    randomTicket: string;
    ticketType: string;
    createdOn: Date;
    expiresOn: Date;
    userId: string;
    nickname: string;
    name: string; // Optional user's full name
    picture: string; // Optional, URL of user's picture
    externalId: string;
    classAcronym: string;
    validMins: number;
    role: string;
}

export const PasswordlessModel = mongoose.model('ticket', PasswordlessSchema);
