import { Router } from 'express';
import { Logger } from '../core/logger.service';
import { QosController } from './qos.controller';

const log = Logger.logger('QosRouter');

// @ts-ignore:
export const qosRouter = new Router();
try {
    qosRouter.route('/ping').get(QosController.apiHealth);
} catch (e) {
    log.error(`Exception resolving QoS controller: ${e}`);
}
