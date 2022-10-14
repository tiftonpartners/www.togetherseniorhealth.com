import { ICollectionDTO } from './dto';

export interface IAgoraUser {
    _id?: string;
    userId: string;
    userNumber: number;
    createdOn?: Date;
    ticket?: string;
}

export interface IAgoraUserCollectionDTO extends ICollectionDTO<IAgoraUser> {}

export enum UserType {
    Prospect = 'ProspectUser',
    Participant = 'ParticipantUser'
}

export const userTypes = new Map<UserType, string>([
    [UserType.Prospect, 'ProspectUser'],
    [UserType.Participant, 'ParticipantUser']
]);

export enum UserState {
    InProgress = 'In Progress',
    Closed = 'Closed',
    NotYetAssigned = 'Not Yet Assigned',
    Assigned = 'Assigned'
}

export const userStates = new Map<UserState, string>([
    [UserState.InProgress, 'In Progress'],
    [UserState.Closed, 'Closed']
]);

export enum IneligibilityReason {
    CognitiveStatus = 'Cognitive Status',
    NoCaregiver = 'No Caregiver',
    InadequateTechnology = 'Inadequate Technology',
    PhysicalLimitations = 'Physical Limitations',
    BehavorialStatus = 'Behavioral Status',
    OnHold = 'On Hold',
    Declined = 'Declined'
}
export const userIneligibilityReason = new Map<IneligibilityReason, string>([
    [IneligibilityReason.CognitiveStatus, 'Cognitive Status'],
    [IneligibilityReason.NoCaregiver, 'No Caregiver'],
    [IneligibilityReason.InadequateTechnology, 'Inadequate Technology'],
    [IneligibilityReason.PhysicalLimitations, 'Physical Limitations'],
    [IneligibilityReason.BehavorialStatus, 'Behavioral Status'],
    [IneligibilityReason.OnHold, 'On Hold'],
    [IneligibilityReason.Declined, 'Declined']
]);

export enum WithdrawnReason {
    ChangeHealthStatus = 'Change in health status',
    ChangeCareState = 'Change in care status',
    OnHold = 'On Hold',
    Declined = 'Declined'
}

export const userWithdrawnReason = new Map<WithdrawnReason, string>([
    [WithdrawnReason.ChangeHealthStatus, 'Change in health status'],
    [WithdrawnReason.ChangeCareState, 'Change in care status'],
    [WithdrawnReason.OnHold, 'On Hold'],
    [WithdrawnReason.Declined, 'Declined']
]);

export enum UserContactMethod {
    Email = 'Email',
    Phone = 'Phone'
}

export const userContactMethods = new Map<UserContactMethod, string>([
    [UserContactMethod.Email, 'Email'],
    [UserContactMethod.Phone, 'Phone']
]);

export interface IAVUser {
    _id?: string;
    __t?: UserType;
    userId: string;
    ticket?: string;
    isNew?: boolean;
    prospectId?: number;
    firstName: string;
    lastName: string;
    screenName: string;
    email: string;
    disableClassEmails?: boolean;
    primaryPhone: string;
    mobilePhone: string;
    contactMethod?: UserContactMethod | '';
    streetAddress?: string;
    city?: string;
    zipCode?: string;
    sid: string;
    pidn: string;
    caregiverFirstName?: string;
    caregiverLastName?: string;
    caregiverEmail?: string;
    disableCaregiverClassEmails?: boolean;
    caregiverPhone?: string;
    caregiverMobilePhone?: string;
    caregiverContactMethod?: UserContactMethod | '';
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

    program: string;
    createdOn?: Date;
    state: UserState;
    outcome?: IneligibilityReason | WithdrawnReason;
}

export interface IProspectUser extends IAVUser {}
export interface IParticipantUser extends IAVUser {}

export class User implements IAVUser {
    userId: string = undefined;
    userNumber: number = undefined;
    isNew: boolean = true;
    firstName: string = '';
    lastName: string = '';
    screenName: string = '';
    email: string = '';
    disableClassEmails: boolean = false;
    primaryPhone: string = '';
    mobilePhone: string = '';
    contactMethod: UserContactMethod | '' = '';
    streetAddress: string = '';
    city: string = '';
    zipCode: string = '';
    sid: string = '';
    pidn: string = '';
    caregiverFirstName: string = '';
    caregiverLastName: string = '';
    caregiverEmail: string = '';
    disableCaregiverClassEmails: boolean = false;
    caregiverPhone: string = '';
    caregiverMobilePhone: string = '';
    caregiverContactMethod: UserContactMethod | '' = '';
    caregiverStreetAddress: string = '';
    caregiverCity: string = '';
    caregiverZipCode: string = '';
    caregiverRel: string = '';
    courseInterest: string = '';
    localEmergencyPhone: string = '';
    primaryEmergencyPhone: string = '';
    secondaryEmergencyPhone: string = '';
    referredBy: string = '';
    communication: string = '';
    notes: string = '';
    program: string = '';
    state: UserState = UserState.InProgress;
    outcome: IneligibilityReason | WithdrawnReason = undefined;
    ticket?: string = undefined;
}
export interface IAVUserCollectionDTO extends ICollectionDTO<IAVUser> {}
