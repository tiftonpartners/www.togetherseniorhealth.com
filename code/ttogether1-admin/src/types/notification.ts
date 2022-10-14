import { ICollectionDTO } from './dto';

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
    RescheduledAdHocSessionReminder = 'RescheduledAdHocSessionReminder'
}

export enum EmailStatus {
    Pending = 'pending',
    Rejected = 'rejected',
    Sent = 'sent'
}

export enum EmailRejectedReason {
    Regex = 'Regex',
    AlreadyTried = 'AlreadyTried',
    AlreadySent = 'AlreadySent',
    APIError = 'APIError',
    ClassAcronym = 'ClassAcronym'
}

export interface IEmailLedger {
    _id: string;
    batchId: string; // unique id based on specific batch of emails being sent
    createdOn: string;
    emailType: EmailType;
    to: string;
    status: EmailStatus;
    rejectedReason?: EmailRejectedReason;
    rejectedMsg?: string;
    properties?: any; // Object to store info specific to email type
}

export interface IEmailLedgerGroup {
    batchId: string; // unique id based on specific batch of emails being sent
    createdOn: string;
    entries: IEmailLedger[];
    emailType: EmailType;
    emailsRejected: number;
    emailsSent: number;
    to: string[];
}

export interface IEmailLedgerCollectionDTO
    extends ICollectionDTO<IEmailLedgerGroup> {}
