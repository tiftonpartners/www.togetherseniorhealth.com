import { Request, Response, NextFunction } from 'express';
import { Logger } from '../core/logger.service';
import { EmailType } from '../db/email-ledger.db';
import { NotificationService } from '../service/notification.service';
import { AuthController } from './auth.controller';

require('moment-recur');
require('dotenv').config();

const log = Logger.logger('NotificationsController');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
/**
 * Controller to implement REST API for Classes in MongoDB
 */
export class NotificationController extends AuthController {
    /**
     * Sends daily class reminder email manually for specified class session
     */
    static apiSendDailyClassReminderEmail = async (
        req: Request<{}, {}, { forceSend: string }>,
        res: Response
    ) => {
        try {
            const forceSend = req.query.forceSend === 'true';
            const t = NotificationController.parseTimeOnQuery(req);
            const results = await NotificationService.sendNotification(
                {
                    emailType: EmailType.DailyClassReminder,
                    now: t,
                },
                forceSend
            );
            res.status(200).send(results);
        } catch (e) {
            res.status(400).send('ERROR: ' + e);
        }
    };

    /**
     * Sends tomorrow daily class reminder email manually for specified class session
     */
    static apiSendTomorrowClassReminderEmail = async (
        req: Request<{}, {}, { forceSend: string }>,
        res: Response
    ) => {
        try {
            const forceSend = req.query.forceSend === 'true';
            const t = NotificationController.parseTimeOnQuery(req);
            t.add(1, 'day');
            const results = await NotificationService.sendNotification(
                {
                    emailType: EmailType.TomorrowClassReminder,
                    now: t,
                },
                forceSend
            );
            res.status(200).send(results);
        } catch (e) {
            res.status(400).send('ERROR: ' + e);
        }
    };

    /**
     * Sends class reminder email manually for specified user id and classAcronym
     */
    static apiSendClassReminderEmailByUserId = async (
        req: Request<
            {},
            {},
            { userId: string; classAcronym: string; forceSend: string }
        >,
        res: Response
    ) => {
        try {
            const forceSend = req.query.forceSend === 'true';
            const userId = req.query.userId;
            const classAcronym = req.query.classAcronym;

            const t = NotificationController.parseTimeOnQuery(req);
            const results = await NotificationService.sendNotification(
                {
                    emailType: EmailType.UserClassReminder,
                    data: {
                        userId,
                        classAcronym,
                    },
                    now: t,
                },
                forceSend
            );
            res.status(200).send(results);
        } catch (e) {
            res.status(400).send('ERROR: ' + e);
        }
    };

    /**
     * Sends rescheduled class reminder email manually for specified user id and classAcronym
     */
    static apiSendRescheduledClassReminderEmailByUserId = async (
        req: Request<
            {},
            {},
            { userId: string; classAcronym: string; forceSend: string }
        >,
        res: Response
    ) => {
        try {
            const forceSend = req.query.forceSend === 'true';
            const userId = req.query.userId;
            const classAcronym = req.query.classAcronym;

            const t = NotificationController.parseTimeOnQuery(req);
            const results = await NotificationService.sendNotification(
                {
                    emailType: EmailType.RescheduledClassReminder,
                    data: {
                        userId,
                        classAcronym,
                    },
                    now: t,
                },
                forceSend
            );
            res.status(200).send(results);
        } catch (e) {
            res.status(400).send('ERROR: ' + e);
        }
    };

    /**
     * Sends daily ad hoc session reminder email manually
     */
    static apiSendDailyAdHocSessionReminderEmail = async (
        req: Request<{}, {}, { forceSend: string }>,
        res: Response
    ) => {
        try {
            const forceSend = req.query.forceSend === 'true';
            const t = NotificationController.parseTimeOnQuery(req);
            const results = await NotificationService.sendNotification(
                {
                    emailType: EmailType.DailyAdHocSessionReminder,
                    now: t,
                },
                forceSend
            );
            res.status(200).send(results);
        } catch (e) {
            res.status(400).send('ERROR: ' + e);
        }
    };

    /**
     * Sends tomorrow's ad hoc session reminder email manually
     */
    static apiSendTomorrowAdHocSessionReminderEmail = async (
        req: Request<{}, {}, { forceSend: string }>,
        res: Response
    ) => {
        try {
            const forceSend = req.query.forceSend === 'true';
            const t = NotificationController.parseTimeOnQuery(req);
            t.add(1, 'day');
            const results = await NotificationService.sendNotification(
                {
                    emailType: EmailType.TomorrowAdHocSessionReminder,
                    now: t,
                },
                forceSend
            );
            res.status(200).send(results);
        } catch (e) {
            res.status(400).send('ERROR: ' + e);
        }
    };

    /**
     * Sends ad hoc session reminder email manually for specified user id
     */
    static apiSendAdHocSessionReminderEmailByUserId = async (
        req: Request<
            {},
            {},
            { userId: string; sessionAcronym: string; forceSend: string }
        >,
        res: Response
    ) => {
        try {
            const forceSend = req.query.forceSend === 'true';
            const userId = req.query.userId;
            const sessionAcronym = req.query.sessionAcronym;
            const t = NotificationController.parseTimeOnQuery(req);
            const results = await NotificationService.sendNotification(
                {
                    emailType: EmailType.UserAdHocSessionReminder,
                    data: {
                        userId,
                        sessionAcronym,
                    },
                    now: t,
                },
                forceSend
            );
            res.status(200).send(results);
        } catch (e) {
            res.status(400).send('ERROR: ' + e);
        }
    };

    /**
     * Sends meet now ad hoc session reminder email manually for specified user id
     */
    static apiSendMeetNowAdHocSessionReminder = async (
        req: Request<
            {},
            {},
            { userId: string; sessionAcronym: string; forceSend: string }
        >,
        res: Response
    ) => {
        try {
            const forceSend = req.query.forceSend === 'true';
            const userId = req.query.userId;
            const sessionAcronym = req.query.sessionAcronym;
            const t = NotificationController.parseTimeOnQuery(req);
            const results = await NotificationService.sendNotification(
                {
                    emailType: EmailType.MeetNowAdHocSessionReminder,
                    data: {
                        userId,
                        sessionAcronym,
                    },
                    now: t,
                },
                forceSend
            );
            res.status(200).send(results);
        } catch (e) {
            res.status(400).send('ERROR: ' + e);
        }
    };

    /**
     * Get all ledger entries
     * @param req
     * @param res
     */
    static apiGetAllLedgerEntries = async (req: Request, res: Response) => {
        try {
            const entries = await NotificationService.getAllLedgerEntries();
            res.status(200).json(entries);
        } catch (e) {
            res.status(500).send(
                'ERROR getting ledger entries: ' + (e as any).message
            );
        }
    };
}
