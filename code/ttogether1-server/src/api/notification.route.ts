import { Router } from 'express';
import { Logger } from '../core/logger.service';
import { NotificationController } from './notification.controller';
import permissions from './permissions.middleware';

const log = Logger.logger('NotificationsRouter');

// @ts-ignore:
export const notificationsRouter = new Router();
try {
    notificationsRouter
        .route('/email/dailyClassReminder')
        .get(
            permissions('apiSendDailyClassReminderEmail'),
            NotificationController.apiSendDailyClassReminderEmail
        );
    notificationsRouter
        .route('/email/tomorrowClassReminder')
        .get(
            permissions('apiSendTomorrowClassReminderEmail'),
            NotificationController.apiSendTomorrowClassReminderEmail
        );
    notificationsRouter
        .route('/email/userClassReminder')
        .get(
            permissions('apiSendClassReminderEmailByUserId'),
            NotificationController.apiSendClassReminderEmailByUserId
        );
    notificationsRouter
        .route('/email/rescheduledClassReminder')
        .get(
            permissions('apiSendRescheduledClassReminderEmailByUserId'),
            NotificationController.apiSendRescheduledClassReminderEmailByUserId
        );
    notificationsRouter
        .route('/email/dailyAdHocSessionReminder')
        .get(
            permissions('apiSendDailyAdHocSessionReminderEmail'),
            NotificationController.apiSendDailyAdHocSessionReminderEmail
        );
    notificationsRouter
        .route('/email/tomorrowAdHocSessionReminder')
        .get(
            permissions('apiSendTomorrowAdHocSessionReminderEmail'),
            NotificationController.apiSendTomorrowAdHocSessionReminderEmail
        );
    notificationsRouter
        .route('/email/userAdHocSessionReminder')
        .get(
            permissions('apiSendAdHocSessionReminderEmailByUserId'),
            NotificationController.apiSendAdHocSessionReminderEmailByUserId
        );
    notificationsRouter
        .route('/email/meetNowAdHocSessionReminder')
        .get(
            permissions('apiSendMeetNowAdHocSessionReminder'),
            NotificationController.apiSendMeetNowAdHocSessionReminder
        );

    notificationsRouter
        .route('/ledger')
        .get(
            permissions('apiGetAllLedgerEntries'),
            NotificationController.apiGetAllLedgerEntries
        );
} catch (e) {
    log.error(`Exception resolving Notifications Controller: ${e}`);
}
