import { Router } from 'express';
import apiKeyCheck from './hubspot.middleware';
import { HubspotController } from './hubspot.controller';
import { Logger } from '../core/logger.service';

const log = Logger.logger('HubspotRouter');
// The router for HubSpot integration
// @ts-ignore
export const hubspotRouter = new Router();

try {
    hubspotRouter
        .route('/add_user')
        .post(apiKeyCheck(), HubspotController.apiCreateHubspotUser);

    hubspotRouter
        .route('/upcoming_class_banner/:userid')
        .get(apiKeyCheck(), HubspotController.apiUpcomingClassBannerData);
} catch (e) {
    log.error(`Exception resolving Userid controller: ${e}`);
}
