require('moment-recur');
require('dotenv').config();
import mongoose from 'mongoose';
import { getMongoConfig, TestGlobalMongoConfig } from '../config/testGlobal';
import { buildCourseSeedData } from '../../src/seed/course.sample';
import { buildParticipantUserSeedData } from '../../src/seed/participants.sample';
import moment from 'moment';
import sgMail from '@sendgrid/mail';
import {
    IBaseEmailData,
    IEmailMsg,
    NotificationService,
} from '../../src/service/notification.service';
import {
    EmailLedgerModel,
    EmailRejectedReason,
    EmailStatus,
    EmailType,
} from '../../src/db/email-ledger.db';
import { jest } from '@jest/globals';
import { AVUserModel } from '../../src/db/user.db';
import { buildSampleAdHocSessions } from '../../src/seed/adhoc-sessions.sample';
import { ClassService } from '../../src/service/class.service';

let mongoConfig = new TestGlobalMongoConfig();

describe('NotificationService Tests', () => {
    const emails: IEmailMsg<IBaseEmailData>[] = [
        {
            to: ['participant.one@tsh.care', 'cg.one@tsh.care'],
            dynamic_template_data: {
                user: {
                    screenName: 'participantOne',
                },
                dashboardUrl: '/',
            },
        },
        {
            to: ['participant.two@tsh.care', 'cg.two@tsh.care'],
            dynamic_template_data: {
                user: {
                    screenName: 'participantTwo',
                },
                dashboardUrl: '/',
            },
        },
        {
            to: ['participant.three@gmail.com', 'cg.three@gmail.com'],
            dynamic_template_data: {
                user: {
                    screenName: 'participantThree',
                },
                dashboardUrl: '/',
            },
        },
    ];

    beforeEach(async () => {
        mongoConfig = await getMongoConfig();
        await mongoose.connect(mongoConfig.mongoUri, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
        });
        await buildParticipantUserSeedData();
        await buildCourseSeedData(null);
        await buildSampleAdHocSessions();
    });

    afterEach(async () => {
        if (mongoose && mongoose.connection && mongoose.connection.db) {
            await mongoose.connection.db.dropDatabase();
        }
        await mongoose.connection.close();
    });

    it('should send class reminder emails', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);

        // first day of MTSTANDG3 test class, 2021-12-08 11:00 Pacific time
        let on = moment('2021-12-08T00:00:00.000Z', moment.ISO_8601);

        const { emailsSent } = await NotificationService.sendNotification({
            emailType: EmailType.DailyClassReminder,
            now: on,
            batchId: 'batchId',
            emailRegex: '.*?',
        });

        // class has multiple participants assigned, but only one participant is
        // in the ParticipantUser collection. The others are referenced as Auth0 users.
        // In practice, all / most of the participants will be in collection
        expect(emailsSent).toEqual(1);
    });

    it('should not send class reminder emails when class is set to disable emails', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);

        // first day of MTSITG3 test class, 2021-12-12 14:00 Pacific time
        let on = moment('2021-12-12T00:00:00.000Z', moment.ISO_8601);

        const { emailsSent } = await NotificationService.sendNotification({
            emailType: EmailType.DailyClassReminder,
            now: on,
            batchId: 'batchId',
            emailRegex: '.*?',
        });

        expect(emailsSent).toEqual(0);
    });

    it('should not send class reminder emails when class session is set to disable emails', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);

        // disable emails for only one specific session
        await ClassService.rescheduleSession(
            {
                disableEmails: true,
            },
            'MTSTANDG3-211208'
        );

        // first day of MTSTANDG3 test class, 2021-12-08
        let on = moment('2021-12-08T00:00:00.000Z', moment.ISO_8601).utc();

        const { emailsSent } = await NotificationService.sendNotification({
            emailType: EmailType.DailyClassReminder,
            now: on,
            batchId: 'batchId',
            emailRegex: '.*?',
        });

        expect(emailsSent).toEqual(0);
    });

    it('should not send class reminder emails when user is set to disable emails', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);

        // first day of MTSITG2 test class, 2021-12-14 11:00 Pacific time
        let on = moment('2021-12-14T00:00:00.000Z', moment.ISO_8601);

        const { emailsSent } = await NotificationService.sendNotification({
            emailType: EmailType.DailyClassReminder,
            now: on,
            batchId: 'batchId',
            emailRegex: '.*?',
        });

        expect(emailsSent).toEqual(1);
    });

    it('should send class reminder email for user id', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);
        const user = await AVUserModel.findOne({
            sid: '1011', // participant 1
        });

        // first day of MTSTANDG3 test class, 2021-12-08 11:00 Pacific time
        let on = moment('2021-12-08T00:00:00.000Z', moment.ISO_8601).utc();

        const { emailsSent } = await NotificationService.sendNotification({
            emailType: EmailType.UserClassReminder,
            now: on,
            data: {
                userId: user?.userId,
                classAcronym: 'MTSTANDG3',
            },
            batchId: 'batchId',
            emailRegex: '.*?',
        });

        expect(emailsSent).toEqual(1);
    });

    it('should not send class reminder email for user id when class is set to disable emails', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);
        const user = await AVUserModel.findOne({
            sid: '1011', // participant 1
        });

        // first day of MTSITG3 test class, 2021-12-12 14:00 Pacific time
        let on = moment('2021-12-12T00:00:00.000Z', moment.ISO_8601).utc();

        const { emailsSent } = await NotificationService.sendNotification({
            emailType: EmailType.UserClassReminder,
            now: on,
            data: {
                userId: user?.userId,
                classAcronym: 'MTSITG3',
            },
            batchId: 'batchId',
            emailRegex: '.*?',
        });

        expect(emailsSent).toEqual(0);
    });

    it('should not send class reminder email for user id when class session is set to disable emails', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);
        const user = await AVUserModel.findOne({
            sid: '1011', // participant 1
        });

        // disable emails for only one specific session
        await ClassService.rescheduleSession(
            {
                disableEmails: true,
            },
            'MTSTANDG3-211208'
        );

        // first day of MTSTANDG3 test class, 2021-12-08
        let on = moment('2021-12-08T00:00:00.000Z', moment.ISO_8601).utc();

        const { emailsSent } = await NotificationService.sendNotification({
            emailType: EmailType.UserClassReminder,
            now: on,
            data: {
                userId: user?.userId,
                classAcronym: 'MTSTANDG3',
            },
            batchId: 'batchId',
            emailRegex: '.*?',
        });

        expect(emailsSent).toEqual(0);
    });

    it('should not send class reminder email for user id when user is set to disable emails', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);
        const user = await AVUserModel.findOne({
            sid: '1020', // participant 10
        });

        //first day of MTSITG2 test class, 2021-12-11 11:00 Pacific time
        let on = moment('2021-12-11T00:00:00.000Z', moment.ISO_8601).utc();

        const { emailsSent } = await NotificationService.sendNotification({
            emailType: EmailType.UserClassReminder,
            now: on,
            data: {
                userId: user?.userId,
                classAcronym: 'MTSITG2',
            },
            batchId: 'batchId',
            emailRegex: '.*?',
        });

        expect(emailsSent).toEqual(1);

        const emailLedger = await EmailLedgerModel.find({
            batchId: 'batchId',
            to: 'cg.ten@tsh.care',
        });

        expect(emailLedger).toBeTruthy();
        expect(emailLedger.length).toBe(1);
        expect(emailLedger[0].status).toBe(EmailStatus.Sent);

        const user2 = await AVUserModel.findOne({
            sid: '1019', // participant 19
        });

        const { emailsSent: emailsSent2, emailsRejected: emailsRejected2 } =
            await NotificationService.sendNotification({
                emailType: EmailType.UserClassReminder,
                now: on,
                data: {
                    userId: user2?.userId,
                    classAcronym: 'MTSITG2',
                },
                batchId: 'batchId',
                emailRegex: '.*?',
            });

        expect(emailsSent2).toEqual(0);

        const emailLedger2 = await EmailLedgerModel.find({
            batchId: 'batchId',
            to: 'participant.nine@tsh.care, cg.nine@tsh.care',
        });

        expect(emailLedger2).toBeTruthy();
        expect(emailLedger2.length).toBe(1);
        expect(emailLedger2[0].status).toBe(EmailStatus.Rejected);
    });

    it('should send daily ad hoc session reminder emails', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);
        // first sample ad hoc session, 2021-10-01 10:00AM Pacific time
        let on = moment('2021-10-01T00:00:00.000Z', moment.ISO_8601);

        const { emailsSent } = await NotificationService.sendNotification({
            emailType: EmailType.DailyAdHocSessionReminder,
            now: on,
            batchId: 'batchId',
            emailRegex: '.*?',
        });

        expect(emailsSent).toEqual(2);
    });

    it('should send ad hoc reminder email for user id', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);
        const user = await AVUserModel.findOne({
            sid: '1011', // participant 1
        });
        // first sample ad hoc session, 2021-10-01 10:00 Pacific time
        let on = moment('2021-10-01T00:00:00.000Z', moment.ISO_8601).utc();

        const { emailsSent } = await NotificationService.sendNotification({
            emailType: EmailType.UserAdHocSessionReminder,
            now: on,
            data: {
                userId: user?.userId,
                sessionAcronym: 'AHTESTSESSION10',
            },
            batchId: 'batchId',
            emailRegex: '.*?',
        });

        expect(emailsSent).toEqual(1);

        return;
    });

    it('should reject sending emails that do not match regex', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);
        const { emailsSent, emailsRejected } =
            await NotificationService.sendEmail(
                EmailType.DailyClassReminder,
                emails,
                'batch',
                '^[a-zA-Z0-9._%+-]+@tsh.care$'
            );

        expect(emailsSent).toEqual(2);
        expect(emailsRejected.length).toEqual(1);
        expect(emailsRejected[0].reason).toEqual(EmailRejectedReason.Regex);
    });

    it('should not reject sending emails that do not match regex when a forwarding email is set', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);

        let on = moment('2021-12-10T00:00:00.000Z', moment.ISO_8601).utc();

        const { emailsSent, emailsRejected } =
            await NotificationService.sendNotification({
                emailType: EmailType.DailyClassReminder,
                now: on,
                batchId: 'batchId',
                forwardingEmail: 'forwardemail@tsh.care',
                emailRegex: '^[a-zA-Z0-9._%+-]+@gmail.com$',
            });

        expect(emailsSent).toEqual(9);
        expect(emailsRejected.length).toEqual(0);

        const emailLedger = await EmailLedgerModel.find({
            batchId: 'batchId',
            to: 'forwardemail@tsh.care',
        });

        expect(emailLedger).toBeTruthy();
        expect(emailLedger.length).toBe(9);
        expect(emailLedger[0].status).toBe(EmailStatus.Sent);
        expect(emailLedger[3].status).toBe(EmailStatus.Sent);
    });

    it('should reject sending emails that do not match class acronym', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);

        let on = moment('2021-12-10T00:00:00.000Z', moment.ISO_8601).utc();

        const { emailsSent, emailsRejected } =
            await NotificationService.sendNotification({
                emailType: EmailType.DailyClassReminder,
                now: on,
                batchId: 'batchId',
                emailRegex: '.*?',
                restrictClassAcronyms: 'MTSTANDG3',
            });

        expect(emailsSent).toEqual(1);
        expect(emailsRejected.length).toEqual(8);

        const { emailsSent: emailsSent2, emailsRejected: emailsRejected2 } =
            await NotificationService.sendNotification({
                emailType: EmailType.DailyClassReminder,
                now: on,
                batchId: 'batchId2',
                emailRegex: '.*?',
                restrictClassAcronyms: 'MTSTANDG4',
            });

        expect(emailsSent2).toEqual(8);
        expect(emailsRejected2.length).toEqual(1);

        const user = await AVUserModel.findOne({
            sid: '1011', // participant 1
        });

        const { emailsSent: emailsSent3, emailsRejected: emailsRejected3 } =
            await NotificationService.sendNotification({
                emailType: EmailType.UserClassReminder,
                now: on,
                data: {
                    userId: user?.userId,
                    classAcronym: 'MTSTANDG3',
                },
                batchId: 'batchId',
                emailRegex: '.*?',
                restrictClassAcronyms: 'MTSTANDG2',
            });

        expect(emailsSent3).toEqual(0);
        expect(emailsRejected3.length).toEqual(1);
    });

    it('should send and reject with multiple criteria', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);

        let on = moment('2021-12-10T00:00:00.000Z', moment.ISO_8601).utc();

        const { emailsSent, emailsRejected } =
            await NotificationService.sendNotification({
                emailType: EmailType.DailyClassReminder,
                now: on,
                batchId: 'batchId',
                forwardingEmail: 'forwardemail@tsh.care',
                emailRegex: '^[a-zA-Z0-9._%+-]+@gmail.com$',
                restrictClassAcronyms: 'MTSTANDG3',
            });

        expect(emailsSent).toEqual(1);
        expect(emailsRejected.length).toEqual(8);

        const emailLedgerSent = await EmailLedgerModel.find({
            batchId: 'batchId',
            to: 'forwardemail@tsh.care',
            status: EmailStatus.Sent,
        });

        expect(emailLedgerSent).toBeTruthy();
        expect(emailLedgerSent.length).toBe(1);
        expect(emailLedgerSent[0].status).toBe(EmailStatus.Sent);

        const emailLedgerReject = await EmailLedgerModel.find({
            batchId: 'batchId',
            to: 'forwardemail@tsh.care',
            status: EmailStatus.Rejected,
        });

        expect(emailLedgerReject).toBeTruthy();
        expect(emailLedgerReject.length).toBe(8);
        expect(emailLedgerReject[3].status).toBe(EmailStatus.Rejected);
        expect(emailLedgerReject[3].rejectedReason).toBe(
            EmailRejectedReason.ClassAcronym
        );
        expect(emailLedgerReject[3].to).toBe('forwardemail@tsh.care');
    });

    it('should forward any emails to one email', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);

        // first day of MTSTANDG3 test class, 2021-12-08
        let on = moment('2021-12-08T00:00:00.000Z', moment.ISO_8601).utc();

        const { emailsSent, emailsRejected } =
            await NotificationService.sendNotification({
                emailType: EmailType.DailyClassReminder,
                now: on,
                batchId: 'batchId',
                emailRegex: '.*?',
                forwardingEmail: 'test-test@tsh.care',
            });

        expect(emailsSent).toEqual(1);

        const emailLedger = await EmailLedgerModel.findOne({
            batchId: 'batchId',
            to: 'test-test@tsh.care',
        });

        expect(emailLedger).toBeTruthy();
        expect(emailLedger?.status).toEqual(EmailStatus.Sent);
    });

    it('should track when emails fail to be sent', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        const apiErrorMsg = 'API ERROR';
        spy.mockImplementation(() => Promise.reject(apiErrorMsg));

        const { emailsSent, emailsRejected } =
            await NotificationService.sendEmail(
                EmailType.DailyClassReminder,
                emails,
                'batch',
                '.*?'
            );

        const emailLedger = await EmailLedgerModel.findOne({
            batchId: 'batch',
            to: emails[0].to.join(', '),
        });

        expect(emailLedger).toBeTruthy();
        expect(emailLedger?.status).toEqual(EmailStatus.Rejected);
        expect(emailLedger?.rejectedReason).toEqual(
            EmailRejectedReason.APIError
        );
        expect(emailLedger?.rejectedMsg).toEqual(apiErrorMsg);
        expect(emailsRejected.length).toEqual(3);
    });

    it('should track when emails are sent', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);
        const { emailsSent, emailsRejected } =
            await NotificationService.sendEmail(
                EmailType.DailyClassReminder,
                emails,
                'batch',
                '.*?'
            );

        const emailLedger = await EmailLedgerModel.findOne({
            batchId: 'batch',
            to: emails[0].to.join(', '),
        });

        expect(emailLedger).toBeTruthy();
        expect(emailLedger?.status).toEqual(EmailStatus.Sent);
        expect(emailLedger?.rejectedReason).toBeUndefined();
        expect(emailLedger?.rejectedMsg).toBeUndefined();
        expect(emailsSent).toEqual(2); // one of the classes is disabled

        // MTSITG3-211215 & MTSITG4-211215 & MTSTANDG1-211215 & MTSTANDG4-211215 & MTSTANDG3-211215 test class
        let on = moment('2021-12-15T00:00:00.000Z', moment.ISO_8601);

        const { emailsSent: emailsSent2 } =
            await NotificationService.sendNotification({
                emailType: EmailType.DailyClassReminder,
                now: on,
                batchId: 'batch2',
                emailRegex: '.*?',
            });

        const emailLedger2 = await EmailLedgerModel.find({
            batchId: 'batch2',
        });

        expect(emailLedger2).toBeTruthy();
        expect(emailLedger2.length).toEqual(9);
        expect(emailsSent2).toEqual(9);
    });

    it('should send class reminder emails', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);

        // first day of MTSTANDG3 test class, 2021-12-08 11:00 Pacific time
        let on = moment('2021-12-08T00:00:00.000Z', moment.ISO_8601);

        const { emailsSent } = await NotificationService.sendNotification({
            emailType: EmailType.DailyClassReminder,
            now: on,
            batchId: 'batchId1',
            emailRegex: '.*?',
        });

        // class has multiple participants assigned, but only one participant is
        // in the ParticipantUser collection. The others are referenced as Auth0 users.
        // In practice, all / most of the participants will be in collection
        expect(emailsSent).toEqual(1);

        const user = await AVUserModel.findOne({
            sid: '1011', // participant 1
        });
        // first sample ad hoc session, 2021-10-01 10:00 Pacific time
        let on2 = moment('2021-10-01T00:00:00.000Z', moment.ISO_8601).utc();

        const { emailsSent: emailsSent2 } =
            await NotificationService.sendNotification({
                emailType: EmailType.UserAdHocSessionReminder,
                now: on2,
                data: {
                    userId: user?.userId,
                    sessionAcronym: 'AHTESTSESSION10',
                },
                batchId: 'batchId2',
                emailRegex: '.*?',
            });

        expect(emailsSent2).toEqual(1);

        const ledgerEntries = await NotificationService.getAllLedgerEntries();
        expect(ledgerEntries).toBeDefined();
        expect(ledgerEntries.length).toEqual(2);
        expect(ledgerEntries[0].status).toEqual(EmailStatus.Sent);
    });

    it('should not attempt to send emails for disabled email types', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);

        let on = moment('2021-12-10T00:00:00.000Z', moment.ISO_8601).utc();

        const { emailsSent, emailsRejected } =
            await NotificationService.sendNotification({
                emailType: EmailType.DailyClassReminder,
                now: on,
                batchId: 'batchId',
                emailRegex: '.*?',
                emailTypesDisabled: undefined,
            });

        expect(emailsSent).toEqual(9);
        expect(emailsRejected.length).toEqual(0);

        const { emailsSent: emailsSent2, emailsRejected: emailsRejected2 } =
            await NotificationService.sendNotification({
                emailType: EmailType.DailyClassReminder,
                now: on,
                batchId: 'batchId',
                emailRegex: '.*?',
                emailTypesDisabled:
                    'DailyClassReminder,RescheduledAdHocSessionReminder',
            });

        expect(emailsSent2).toEqual(0);
        expect(emailsRejected2.length).toEqual(0);
    });
    it('should send emails to both user and caregiver email addresses if applicable', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);

        let on = moment('2021-12-10T00:00:00.000Z', moment.ISO_8601).utc();

        const { emailsSent, emailsRejected } =
            await NotificationService.sendNotification({
                emailType: EmailType.DailyClassReminder,
                now: on,
                batchId: 'batchId',
                emailRegex: '.*?',
            });

        expect(emailsSent).toEqual(9);
        expect(emailsRejected.length).toEqual(0);

        const { emailsSent: emailsSent2, emailsRejected: emailsRejected2 } =
            await NotificationService.sendNotification({
                emailType: EmailType.DailyClassReminder,
                now: on,
                batchId: 'batchId',
                emailRegex: '.*?',
            });

        expect(emailsSent2).toEqual(0);
        expect(emailsRejected2.length).toEqual(9);
        expect(emailsRejected2[0].reason).toEqual(
            EmailRejectedReason.AlreadySent
        );
    });

    it('should not reject sending ad hoc emails if class acronym is set', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);

        let on = moment('2021-12-10T00:00:00.000Z', moment.ISO_8601).utc();

        const { emailsSent, emailsRejected } =
            await NotificationService.sendNotification({
                emailType: EmailType.DailyClassReminder,
                now: on,
                batchId: 'batchId',
                emailRegex: '.*?',
                restrictClassAcronyms: 'MTSTANDG3',
            });

        expect(emailsSent).toEqual(1);
        expect(emailsRejected.length).toEqual(8);

        const { emailsSent: emailsSent2, emailsRejected: emailsRejected2 } =
            await NotificationService.sendNotification({
                emailType: EmailType.DailyClassReminder,
                now: on,
                batchId: 'batchId',
                emailRegex: '.*?',
                restrictClassAcronyms: 'MTSTANDG4',
            });

        expect(emailsSent2).toEqual(8);
        expect(emailsRejected2.length).toEqual(1);

        const user = await AVUserModel.findOne({
            sid: '1011', // participant 1
        });

        const { emailsSent: emailsSent3, emailsRejected: emailsRejected3 } =
            await NotificationService.sendNotification({
                emailType: EmailType.UserClassReminder,
                now: on,
                data: {
                    userId: user?.userId,
                    classAcronym: 'MTSTANDG3',
                },
                batchId: 'batchId',
                emailRegex: '.*?',
                restrictClassAcronyms: 'MTSTANDG2',
            });

        expect(emailsSent3).toEqual(0);
        expect(emailsRejected3.length).toEqual(1);
    });

    it('should remove bcc when bcc address is also included as a recipient', async () => {
        const spy = jest.spyOn(sgMail, 'send');
        spy.mockResolvedValue([
            { statusCode: 200, body: {}, headers: null },
            {},
        ]);

        let on = moment('2021-12-10T00:00:00.000Z', moment.ISO_8601).utc();

        const { emailsSent, emailsRejected } =
            await NotificationService.sendNotification({
                emailType: EmailType.DailyClassReminder,
                now: on,
                batchId: 'batchId',
                emailRegex: '.*?',
                emailTypesDisabled: undefined,
                bcc: 'cg.one@tsh.care',
            });
        expect(emailsSent).toEqual(9);
        expect(emailsRejected.length).toEqual(0);

        const emailLedger = await EmailLedgerModel.find({
            batchId: 'batchId',
            to: 'participant.one@tsh.care, cg.one@tsh.care',
        });
        expect(emailLedger).toBeTruthy();

        // for classes g3 and g4
        expect(emailLedger.length).toBe(2);
        expect(emailLedger[0].bcc).toBeUndefined();
        expect(emailLedger[0].status).toEqual(EmailStatus.Sent);

        const emailLedger2 = await EmailLedgerModel.find({
            batchId: 'batchId',
            to: 'participant.two@tsh.care, cg.two@tsh.care',
        });
        expect(emailLedger2).toBeTruthy();

        expect(emailLedger2.length).toBe(1);
        expect(emailLedger2[0].bcc).toEqual('cg.one@tsh.care');
        expect(emailLedger2[0].status).toEqual(EmailStatus.Sent);

        const { emailsSent: emailsSent2, emailsRejected: emailsRejected2 } =
            await NotificationService.sendNotification({
                emailType: EmailType.DailyClassReminder,
                now: on,
                batchId: 'batchId2',
                emailRegex: '.*?',
                emailTypesDisabled: undefined,
                forwardingEmail: 'cg.one@tsh.care',
                bcc: 'cg.one@tsh.care',
            });
        expect(emailsSent2).toEqual(9);
        expect(emailsRejected2.length).toEqual(0);

        const emailLedger3 = await EmailLedgerModel.find({
            batchId: 'batchId2',
            to: 'cg.one@tsh.care',
        });
        expect(emailLedger3).toBeTruthy();

        // all are forwarded
        expect(emailLedger3.length).toBe(9);
        expect(emailLedger3[0].bcc).toBeUndefined();
        expect(emailLedger3[0].status).toEqual(EmailStatus.Sent);
    });
});
