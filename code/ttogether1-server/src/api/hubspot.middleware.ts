import { NextFunction, Request, Response } from 'express';
import { Logger } from '../core/logger.service';

const log = Logger.logger('ApiKeyCheck');

export default function apiKeyCheck() {
    return async (req: Request, resp: Response, next: NextFunction) => {
        // check api key
        let our_api_key = process.env.HUBSPOT_API_KEY ?? '';
        if (our_api_key === '') {
            log.warn(
                'HUBSPOT_API_KEY is not set, but the call arrived. Ignoring.'
            );
            return;
        }
        const api_key = req.headers?.api_key ?? '';
        if (api_key === process.env.HUBSPOT_API_KEY) {
            next();
            return;
        } else {
            resp.status(403).json({
                message: `Forbidden: wrong api_key header is passed`,
            });
        }
    };
}
