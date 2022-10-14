require('dotenv').config();
var crypto = require('crypto');
var base64url = require('base64url');
const moment = require('moment-timezone');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

import { Moment } from 'moment';
import { Logger } from '../core/logger.service';
import { ClassModel } from '../db/class.db';
import { Course, CourseModel } from '../db/course.db';
import {
    EmailLedger,
    EmailLedgerModel,
    EmailRejectedReason,
    EmailStatus,
    EmailType,
} from '../db/email-ledger.db';
import { asyncFilter } from '../db/helpers';
import { Passwordless, PasswordlessModel } from '../db/passwordless.db';
import { Program, ProgramModel } from '../db/program.db';
import {
    AdHocSession,
    AdHocSessionModel,
    AdHocSessionType,
    adHocSessionTypes,
    ClassSession,
    LegacyAdHocSessionType,
    legacyAdHocSessionTypes,
} from '../db/session.db';
import { AVUser, AVUserModel } from '../db/user.db';
import { AdHocSessionService } from './adhoc-session.service';
import { ClassService } from './class.service';
import * as NotificationTemplates from './notification.templates.json';
import * as NotificationTestTemplates from './notification.templates.test.json';
import { PasswordlessService } from './passwordless.service';

const log = Logger.logger('NotificationService');

export interface IEmailRejected {
    to: string;
    reason: EmailRejectedReason;
    msg?: string;
}

export interface IEmailResults {
    emailsSent: number;
    emailsRejected: IEmailRejected[];
}

export interface IEmailMsg<T extends Object> {
    to: string[];
    from?: string;
    bcc?: string;
    dynamic_template_data: T;
    template_id?: string;
    properties?: any;
    emailId?: string;
}

export interface IBaseEmailData {
    user: Pick<AVUser, 'screenName' | 'tz'>;
    dashboardUrl: string;
}

export interface ISessionReminderEmailData extends IBaseEmailData {
    className?: string;
    courseName?: string;
    session: Partial<ClassSession>;
    program?: Program;
}

export interface IAdHocSessionReminderEmailData extends IBaseEmailData {
    session: Partial<AdHocSession>;
}

/**
 * Provides additional functionality for Notifications via email and sms
 */
export class NotificationService {
    /**
     * Takes in email addresses and associated data for the template
     * and attempts to send them through the send grid api. Tracks the emails sent and
     * emails rejected with various reasons.
     *
     * @param params Object with email specific info needed to fetch template data
     * @param forceSend Override ledger check and send email
     */
    static async sendNotification(
        params: {
            emailType: EmailType;
            now?: moment.Moment;
            data?: any;
            batchId?: string;
            emailRegex?: string;
            restrictClassAcronyms?: string;
            forwardingEmail?: string;
            emailTypesDisabled?: string;
            bcc?: string;
        },
        forceSend: boolean = false
    ): Promise<IEmailResults> {
        const t: moment.Moment = params.now || moment();
        let emailResults: IEmailResults = {
            emailsSent: 0,
            emailsRejected: [],
        };
        const emailTypes =
            params.emailTypesDisabled || process.env.EMAIL_TYPES_DISABLED || '';
        const emailTypesDisabled = emailTypes.split(',');
        const emailRegex = params.emailRegex || process.env.EMAIL_TO_REGEX;
        const bcc = params.bcc || process.env.EMAIL_BCC;
        const forwardingEmail =
            params.forwardingEmail || process.env.EMAIL_FORCE_FORWARD;
        const batchId = params.batchId || `batch-${moment().unix()}`;

        try {
            let emails: (IEmailMsg<ISessionReminderEmailData> | undefined)[] =
                [];

            if (!emailTypesDisabled.includes(params.emailType)) {
                switch (params.emailType) {
                    case EmailType.DailyClassReminder:
                    case EmailType.TomorrowClassReminder:
                        const classes =
                            await NotificationService.createDailyClassReminderEmail(
                                t
                            );
                        emails = (
                            [] as (
                                | IEmailMsg<ISessionReminderEmailData>
                                | undefined
                            )[]
                        ).concat(...classes);
                        break;
                    case EmailType.UserClassReminder:
                    case EmailType.RescheduledClassReminder:
                        emails = [
                            await NotificationService.createClassReminderEmailByUserId(
                                params.data.userId,
                                params.data.classAcronym,
                                t
                            ),
                        ];
                        break;
                    case EmailType.DailyAdHocSessionReminder:
                    case EmailType.TomorrowAdHocSessionReminder:
                        const sessions =
                            await NotificationService.createDailyAdHocSessionReminderEmail(
                                t
                            );
                        emails = (
                            [] as (
                                | IEmailMsg<ISessionReminderEmailData>
                                | undefined
                            )[]
                        ).concat(...sessions);
                        break;
                    case EmailType.UserAdHocSessionReminder:
                    case EmailType.MeetNowAdHocSessionReminder:
                    case EmailType.RescheduledAdHocSessionReminder:
                        emails = [
                            await NotificationService.createAdHocSessionReminderEmailByUserId(
                                params.data.userId,
                                params.data.sessionAcronym,
                                t
                            ),
                        ];
                        break;
                    default:
                        throw 'Email type not supported';
                }

                emailResults = await NotificationService.sendEmail(
                    params.emailType,
                    emails.filter(
                        (email) => email !== undefined
                    ) as IEmailMsg<IBaseEmailData>[],
                    batchId,
                    emailRegex,
                    forwardingEmail,
                    bcc,
                    forceSend
                );
            }
        } catch (e) {
            throw e;
        }

        return emailResults;
    }

    /**
     * Takes in email addresses and associated data for the template
     * and attempts to send them through the send grid api. Tracks the emails sent and
     * emails rejected with various reasons.
     *
     * @param emailType Type determines template id
     * @param emails Array of email addresses with associated template data
     * @param batchId Unique ID of batch with timestamp. Any emails sent at same time on cron schedule
     * should have same batch ID, where one-off emails should have their own
     * @param emailRegex Regex string override for testing, otherwise from env
     */
    static async sendEmail<T extends IBaseEmailData>(
        emailType: EmailType,
        emailMsgs: IEmailMsg<T>[],
        batchId: string,
        emailRegex: string | undefined = process.env.EMAIL_TO_REGEX,
        forwardingEmail: string | undefined = process.env.EMAIL_FORCE_FORWARD,
        bcc: string | undefined = process.env.EMAIL_BCC,
        forceSend: boolean = false
    ): Promise<IEmailResults> {
        let emailsSent: number = 0;
        let emailsRejected: IEmailRejected[] = [];

        const emails = [...emailMsgs];

        try {
            let batchWrite: EmailLedger[] = [];

            // If there is a forwarding email, completely ignore the email regex
            const allowedEmails =
                forwardingEmail === undefined
                    ? new RegExp(emailRegex || '')
                    : new RegExp('');

            // Filter out any emails that have been tried already
            let emailsFiltered = await asyncFilter(emails, async (email) => {
                let ledger = {
                    emailId: crypto.randomBytes(48).toString('hex') + batchId,
                    to: forwardingEmail || email.to.join(', '),
                    batchId,
                    emailType,
                    properties: email.properties,
                    createdOn: moment().toISOString(),
                } as EmailLedger;

                email.emailId = ledger.emailId;

                if (!forceSend) {
                    const pastEmail = await EmailLedgerModel.findOne({
                        to: ledger.to,
                        emailType,
                        properties: {
                            ...email.properties,
                        },
                    });

                    // Only reject if the email was sent successfully with the above properties
                    // if it was rejected before, then we can try again in case env vars have changed since
                    if (pastEmail && pastEmail.status === EmailStatus.Sent) {
                        emailsRejected.push({
                            to: ledger.to,
                            reason: EmailRejectedReason.AlreadySent,
                        } as IEmailRejected);

                        ledger.rejectedReason = EmailRejectedReason.AlreadySent;
                        ledger.status = EmailStatus.Rejected;

                        batchWrite.push(ledger);
                        return false;
                    }
                }

                batchWrite.push(ledger);
                return true;
            });

            if (emailsFiltered.length > 0) {
                // only check for class emails
                if (
                    emailType === EmailType.DailyClassReminder ||
                    emailType === EmailType.TomorrowClassReminder ||
                    emailType === EmailType.RescheduledClassReminder ||
                    emailType === EmailType.UserClassReminder
                ) {
                    // Filter out any emails that do not match class acronym in .env
                    emailsFiltered = emailsFiltered.filter((email) => {
                        let ledger = batchWrite.find(
                            (batch) => batch.emailId === email.emailId
                        );

                        if (!forceSend && ledger) {
                            if (
                                !ledger.properties ||
                                !ledger.properties.classAcronym
                            ) {
                                emailsRejected.push({
                                    to: ledger.to,
                                    reason: EmailRejectedReason.ClassAcronym,
                                } as IEmailRejected);

                                ledger.rejectedReason =
                                    EmailRejectedReason.ClassAcronym;
                                ledger.status = EmailStatus.Rejected;

                                return false;
                            }
                        }

                        return true;
                    });
                }
            }

            // check to see if emails are disabled for the user / cg
            if (emailsFiltered.length > 0) {
                // only check for class emails
                if (
                    emailType === EmailType.DailyClassReminder ||
                    emailType === EmailType.TomorrowClassReminder ||
                    emailType === EmailType.RescheduledClassReminder ||
                    emailType === EmailType.UserClassReminder
                ) {
                    emailsFiltered = emailsFiltered.filter((email) => {
                        let ledger = batchWrite.find(
                            (batch) => batch.emailId === email.emailId
                        );

                        if (!forceSend && ledger) {
                            if (
                                ledger.properties &&
                                ledger.properties.disableCaregiverClassEmails &&
                                ledger.properties.disableUserClassEmails
                            ) {
                                emailsRejected.push({
                                    to: ledger.to,
                                    reason: EmailRejectedReason.UserEmailsDisabled,
                                } as IEmailRejected);

                                ledger.rejectedReason =
                                    EmailRejectedReason.UserEmailsDisabled;
                                ledger.status = EmailStatus.Rejected;

                                return false;
                            }
                            if (
                                ledger.properties &&
                                ledger.properties.disableCaregiverClassEmails
                            ) {
                                // if there is a cg as well as participant
                                if (email.to.length > 1) {
                                    // remove cg as they have emails disabled
                                    email.to.splice(1, 1);
                                    ledger.to =
                                        forwardingEmail || email.to.join(', ');
                                }
                            }
                            if (
                                ledger.properties &&
                                ledger.properties.disableUserClassEmails
                            ) {
                                // if there is a cg as well as participant
                                if (email.to.length > 1) {
                                    // remove participant as they have emails disabled
                                    email.to.splice(0, 1);
                                    ledger.to =
                                        forwardingEmail || email.to.join(', ');
                                } else {
                                    emailsRejected.push({
                                        to: ledger.to,
                                        reason: EmailRejectedReason.UserEmailsDisabled,
                                    } as IEmailRejected);

                                    ledger.rejectedReason =
                                        EmailRejectedReason.UserEmailsDisabled;
                                    ledger.status = EmailStatus.Rejected;

                                    return false;
                                }
                            }
                        }

                        return true;
                    });
                }
            }

            if (emailsFiltered.length > 0) {
                // Filter out any emails that do not comply with regex
                emailsFiltered = emailsFiltered.filter((email) => {
                    let ledger = batchWrite.find(
                        (batch) => batch.emailId === email.emailId
                    );

                    const allowed = email.to.filter((e) =>
                        allowedEmails.test(e)
                    );

                    // updated the to field with filtered emails that are allowed
                    email.to = allowed;

                    if (!emailRegex || allowed.length === 0) {
                        if (ledger) {
                            emailsRejected.push({
                                to: ledger.to,
                                reason: EmailRejectedReason.Regex,
                            } as IEmailRejected);

                            ledger.rejectedReason = EmailRejectedReason.Regex;
                            ledger.status = EmailStatus.Rejected;
                        }

                        return false;
                    }
                    return true;
                });
            }
            // Save an initial ledger line for each email trying to be sent in this batch
            // @ts-ignore
            await EmailLedgerModel.bulkWrite(
                batchWrite.map((ledger) => {
                    return {
                        insertOne: {
                            document: ledger,
                        },
                    };
                })
            );
            if (emailsFiltered.length > 0) {
                const $emailUpdates = emailsFiltered.map(async (email) => {
                    let ledger = {
                        updateOne: {
                            filter: {
                                emailId: email.emailId,
                            },
                            update: {
                                $set: {
                                    status: EmailStatus.Sent,
                                } as any,
                            },
                            upsert: true,
                        },
                    };

                    try {
                        const toEmail = forwardingEmail
                            ? [forwardingEmail]
                            : email.to;
                        // remove bcc if it is already included as a recipient
                        const bccEmail =
                            bcc && !toEmail.includes(bcc) ? bcc : undefined;

                        if (bccEmail) {
                            ledger.updateOne.update.$set = {
                                ...ledger.updateOne.update.$set,
                                bcc: bccEmail,
                            };
                        }
                        await NotificationService.apiEmail(
                            toEmail,
                            bccEmail,
                            emailType,
                            email.dynamic_template_data
                        );

                        emailsSent++;
                    } catch (e) {
                        emailsRejected.push({
                            to: forwardingEmail || email.to.join(', '),
                            reason: EmailRejectedReason.APIError,
                        } as IEmailRejected);

                        ledger.updateOne.update.$set = {
                            status: EmailStatus.Rejected,
                            rejectedReason: EmailRejectedReason.APIError,
                            rejectedMsg: e,
                        };
                    }

                    return ledger;
                });
                const emailUpdates = await Promise.all($emailUpdates);

                // Update ledger as each is sent or has an api error
                // @ts-ignore
                await EmailLedgerModel.bulkWrite(emailUpdates);
            }

            log.info(
                ` (sendEmail:${emailType}) Sent ${emailsSent} email(s) and had ${emailsRejected.length} rejections`
            );
        } catch (e) {
            log.error(e);
        }

        return {
            emailsSent,
            emailsRejected,
        };
    }

    /**
     * Compose object for send grid api
     *
     * @param toEmail Recipient of email
     * @param templateType Type determines template id
     * @param templateData The data that gets sent to API for dynamic templates
     */
    static async apiEmail<T extends IBaseEmailData>(
        toEmail: string[],
        bccEmail: string | undefined,
        templateType: EmailType,
        templateData: T
    ): Promise<IEmailMsg<T>> {
        let templateId;

        if (process.env.NODE_ENV !== 'production') {
            templateId = NotificationTestTemplates[templateType];
        } else {
            templateId = NotificationTemplates[templateType];
        }
        const msg = {
            to: toEmail, // this will always come from user email and/or cg email OR forwarding email if set
            bcc: bccEmail,
            from: process.env.EMAIL_SENDER,
            dynamic_template_data: templateData,
            template_id: templateId,
        } as IEmailMsg<T>;
        return new Promise((resolve, reject) => {
            sgMail
                .send(msg)
                .then(() => {
                    resolve(msg);
                })
                .catch((error: string) => {
                    reject(error);
                });
        });
    }

    /**
     * Creates email message objects for specific users in classes upcoming
     * @param classAcronym Acronym used to find class
     * @param now Override for current time
     */
    static async createClassReminderEmailByAcronym(
        classAcronym: string,
        now?: moment.Moment
    ): Promise<
        (IEmailMsg<ISessionReminderEmailData> | undefined)[] | undefined
    > {
        const t: moment.Moment = now || moment();
        let data: (IEmailMsg<ISessionReminderEmailData> | undefined)[];

        try {
            const klass = await ClassModel.findOne({
                acronym: classAcronym,
            });

            if (!klass) {
                throw 'No class found for classAcronym: ' + classAcronym;
            }

            const course = await CourseModel.findById(klass.courseId);

            if (!course) {
                throw 'No course found for classAcronym: ' + classAcronym;
            }
            await klass.reorderSessionsByStartDate();
            klass.filterSessionsUpcomming(t);

            if (!klass.sessions || klass.sessions.length === 0) {
                return;
            }

            const nextSession = klass.sessions[0];
            await nextSession.addInstructorData();

            if (nextSession.disableEmails) {
                log.warn(
                    ` (createClassReminderEmailByAcronym) The following class session was skipped from sending emails as it is disabled: ${nextSession.acronym}`
                );
                return;
            }

            const $emails = klass.participants.map(
                async (participantId) =>
                    await NotificationService.composeSessionReminderEmail(
                        participantId,
                        nextSession,
                        course,
                        klass.name,
                        classAcronym
                    )
            );

            let emails = await Promise.all($emails);

            data = emails.filter((email) => email !== undefined);
        } catch (e) {
            throw e;
        }

        return data;
    }

    /**
     * Finds all classes with upcoming sessions today OR tomorrow and sends emails to the
     * participants. Primarily used by cron on schedule. Based on now var being updated
     * to be tomorrow's date from caller.
     * @param now Override for current time
     */
    static async createDailyClassReminderEmail(
        now?: moment.Moment
    ): Promise<(IEmailMsg<ISessionReminderEmailData> | undefined)[][]> {
        const classesToday = await ClassService.getUpcomingClassesToday(now);

        if (!classesToday || classesToday.length === 0) {
            log.warn(
                ` (sendDailyClassReminderEmail) No classes upcoming today`
            );
        }

        // filter out classes that are disabled from sending emails
        const classesTodayEnabled = classesToday.filter(
            (klass) => !klass.disableEmails
        );

        if (
            classesToday &&
            classesToday.length > 0 &&
            (!classesTodayEnabled || classesTodayEnabled.length === 0)
        ) {
            log.warn(
                ` (sendDailyClassReminderEmail) The following classes were skipped from sending emails as they are disabled: ${classesToday
                    .map((c) => c.acronym)
                    .join(', ')}`
            );
        }

        const $classEmails = classesTodayEnabled.map(async (klass) => {
            const emails =
                await NotificationService.createClassReminderEmailByAcronym(
                    klass.acronym,
                    now
                );

            return emails;
        });
        const results = await Promise.all($classEmails);

        return results.filter(Boolean) as (
            | IEmailMsg<ISessionReminderEmailData>
            | undefined
        )[][];
    }

    /**
     * Creates email message objects for specific user's next upcoming class
     * @param userId ID of user
     * @param classAcronym Acronym of class
     * @param now Override for current time
     */
    static async createClassReminderEmailByUserId(
        userId: string,
        classAcronym: string,
        now?: moment.Moment
    ): Promise<IEmailMsg<ISessionReminderEmailData> | undefined> {
        const t: moment.Moment = now || moment();
        let data: IEmailMsg<ISessionReminderEmailData> | undefined;

        try {
            const user = await AVUserModel.findOne({
                userId,
            });

            if (!user) {
                return;
            }

            const classes = await ClassService.getUserClasses(userId);

            if (!classes || classes.length === 0) {
                throw 'No classes found for userId: ' + userId;
            }

            const $classesFiltered = classes
                .filter((a) => a.acronym === classAcronym)
                .map(async (klass) => {
                    await klass.reorderSessionsByStartDate();
                    klass.filterSessionsUpcomming(t);
                    return klass;
                });
            let classesFiltered = await Promise.all($classesFiltered);
            classesFiltered = classesFiltered
                .filter((a) => {
                    return a.sessions && a.sessions.length > 0;
                })
                .sort((a, b) => {
                    const aDate: Moment = moment(a.sessions[0].date0Z);
                    const bDate: Moment = moment(b.sessions[0].date0Z);
                    return aDate.isSame(bDate)
                        ? 0
                        : aDate.isBefore(bDate)
                        ? -1
                        : 1;
                });
            if (!classesFiltered || classesFiltered.length === 0) {
                throw 'No upcoming sessions for this user';
            }

            const klass = classesFiltered[0];

            if (klass && klass.disableEmails) {
                log.warn(
                    ` (createClassReminderEmailByUserId) The following class was skipped from sending emails as it is disabled: ${klass.acronym}`
                );
                return;
            }

            const course = await CourseModel.findById(klass.courseId);

            if (!course) {
                throw 'No course found for class acronym: ' + klass.acronym;
            }
            const nextSession = klass.sessions[0];

            if (nextSession && nextSession.disableEmails) {
                log.warn(
                    ` (createClassReminderEmailByUserId) The following class session was skipped from sending emails as it is disabled: ${nextSession.acronym}`
                );
                return;
            }

            await nextSession.addInstructorData();

            data = await NotificationService.composeSessionReminderEmail(
                userId,
                nextSession,
                course,
                klass.name,
                classAcronym
            );
        } catch (e) {
            throw e;
        }

        return data;
    }

    /**
     * Creates email message objects for specific users in ad hoc sessions upcoming
     * @param sessionAcronym Acronym used to find ad hoc session
     * @param now Override for current time
     */
    static async createAdHocSessionReminderEmailByAcronym(
        sessionAcronym: string,
        now?: moment.Moment
    ): Promise<(IEmailMsg<ISessionReminderEmailData> | undefined)[]> {
        const t: moment.Moment = now || moment();
        let data: (IEmailMsg<ISessionReminderEmailData> | undefined)[];

        try {
            const session = await AdHocSessionModel.findOne({
                acronym: sessionAcronym,
            });

            if (!session) {
                throw 'No session found for sessionAcronym: ' + sessionAcronym;
            }

            await session.addInstructorData();

            const $emails = session.participants.map(
                async (participantId) =>
                    await NotificationService.composeSessionReminderEmail(
                        participantId,
                        session
                    )
            );

            let emails = await Promise.all($emails);
            data = emails.filter((email) => email !== undefined);
        } catch (e) {
            throw e;
        }

        return data;
    }

    /**
     * Finds all ad hoc sessions today OR tomorrow and sends emails to the
     * participants. Primarily used by cron on schedule. Based on now var being updated
     * to be tomorrow's date from caller.
     * @param now Override for current time
     */
    static async createDailyAdHocSessionReminderEmail(
        now?: moment.Moment
    ): Promise<(IEmailMsg<ISessionReminderEmailData> | undefined)[][]> {
        const sessionsUpcoming =
            await AdHocSessionService.getAllUpcomingSessionsToday(now);
        if (!sessionsUpcoming || sessionsUpcoming.length === 0) {
            log.warn(
                ` (createDailyAdHocSessionReminderEmail) No ad hoc sessions upcoming today`
            );
        }
        const $sessionEmails = sessionsUpcoming.map(async (session) => {
            const emails =
                await NotificationService.createAdHocSessionReminderEmailByAcronym(
                    session.acronym,
                    now
                );

            return emails;
        });
        const results = await Promise.all($sessionEmails);

        return results;
    }

    /**
     * Creates email message objects for specific user's next upcoming ad hoc session
     * @param userId ID of user
     * @param sessionAcronym Acronym of session
     * @param now Override for current time
     */
    static async createAdHocSessionReminderEmailByUserId(
        userId: string,
        sessionAcronym: string,
        now?: moment.Moment
    ): Promise<IEmailMsg<ISessionReminderEmailData> | undefined> {
        let data: IEmailMsg<ISessionReminderEmailData> | undefined;

        try {
            if (!sessionAcronym) {
                throw 'Session acronym must passed through data object';
            }

            const user = await AVUserModel.findOne({
                userId,
            });

            if (!user) {
                return;
            }

            const sessions = await AdHocSessionService.getUpcomingSessions(
                userId,
                now
            );

            if (!sessions || sessions.length === 0) {
                throw 'No ad hoc sessions found for userId: ' + userId;
            }

            const $sessionsSorted = sessions
                .filter((a) => a.acronym === sessionAcronym)
                .sort((a, b) => {
                    const aDate = moment(a.lobbyOpenTime);
                    const bDate = moment(b.lobbyOpenTime);
                    return aDate.isBefore(bDate) ? -1 : 1;
                })
                .map(async (a) => {
                    await a.addInstructorData();
                    return a;
                });

            const sessionsSorted = await Promise.all($sessionsSorted);

            data = await NotificationService.composeSessionReminderEmail(
                userId,
                sessionsSorted[0]
            );
        } catch (e) {
            throw e;
        }

        return data;
    }

    /**
     * Composes IEmailMsg object specific to session based emails that contains information
     * needed for send grid dynamic template to fill. This is used for both class and ad-hoc session
     * based emails
     */
    static async composeSessionReminderEmail(
        userId: string,
        session: ClassSession | AdHocSession,
        course?: Course,
        className?: string,
        classAcronym?: string
    ): Promise<IEmailMsg<ISessionReminderEmailData> | undefined> {
        const user = await AVUserModel.findOne({
            userId,
        });

        if (!user || !user.email) {
            return;
        }

        const program = (await ProgramModel.findOne({
            acronym: user.program,
        })) as Program;

        const passwordless = (await PasswordlessModel.findOne({
            userId,
        })) as Passwordless;

        let ticket;
        if (passwordless) {
            ticket = passwordless.randomTicket;
        } else {
            // No ticket has been created yet for this user

            ticket = await PasswordlessService.generateRandomUserTicket({
                userId,
            });
        }

        const sessionType =
            (session as any).sessionType !== undefined
                ? adHocSessionTypes.get(
                      (session as any).sessionType as AdHocSessionType
                  ) ||
                  legacyAdHocSessionTypes.get(
                      (session as any).sessionType as LegacyAdHocSessionType
                  )
                : undefined;

        // If cg email exists and is not same as user email, then send to them as well
        const to =
            user.caregiverEmail && user.caregiverEmail !== user.email
                ? [user.email, user.caregiverEmail]
                : [user.email];
        return {
            to,
            dynamic_template_data: {
                dashboardUrl: `${process.env.EMAIL_DASHBOARD_URL}?ticket=${ticket}`,
                className,
                courseName: course?.name,
                program,
                user: {
                    screenName: user.screenName,
                    tz: moment(session.scheduledStartTime)
                        .tz(user.tz)
                        .format('z'),
                },
                session: {
                    date0Z: moment(session.scheduledStartTime)
                        .tz(user.tz)
                        .format('L'),
                    scheduledStartTime: moment(session.scheduledStartTime)
                        .tz(user.tz)
                        .format('h:mm A'),
                    lobbyOpenTime: moment(session.lobbyOpenTime)
                        .tz(user.tz)
                        .format('h:mm A'),
                    tz: session.tz,
                    //@ts-ignore
                    sessionType,
                    instructorData: {
                        name: session.instructorData?.name,
                    },
                },
            },
            properties: {
                userId,
                sessionId: session.providerId,
                classAcronym,
                disableUserClassEmails: user.disableClassEmails,
                disableCaregiverClassEmails: user.disableCaregiverClassEmails,
            },
        };
    }
    /**
     * Get all ledger entries available
     */
    static async getAllLedgerEntries(): Promise<EmailLedger[]> {
        try {
            return await EmailLedgerModel.find();
        } catch (e) {
            throw e;
        }
    }
}
