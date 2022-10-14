require('dotenv').config();
import { Request } from 'express';
import { Logger } from '../core/logger.service';
import { UserService, UserInfo } from '../av/user.service';
import { Moment } from 'moment';
var jwt = require('jsonwebtoken');
const moment = require('moment-timezone');
require('moment-recur');

/**
 * This is an abstract class that implements the nuts-and-bolts
 * of working with the authentication token in a request.
 * It decodes the token, and caches the user via the UserService
 *
 * It also support overriding the current date/time via the 'forceDate'
 * query string.
 */
export class AuthController {
    // Decode the authorization token and cache the user information in the
    // user service
    static async rememberUser(req: Request): Promise<UserInfo | undefined> {
        if (!req.headers['authorization']) {
            return;
        }
        const token: string = req.headers['authorization']?.split(' ')[1] || '';
        const tokenDecoded: any = jwt.decode(token, { complete: true });
        return UserService.rememberUser(tokenDecoded.payload);
    }

    /**
     * If the date is overridden in the query string, parse and
     * return the forced date.  Otherwise, the
     * current date is returned
     * @param req
     * @returns The date as a moment.  It will always have h,m,s=0 and be
     *  UTC
     */
    static parseDateOnQuery(req: Request): any {
        const d: string = req.query.forceDate as string;
        if (d && d.match(/\d{4}\-\d{2}\-\d{2}/g)) {
            return d;
        } else {
            return moment().format('YYYY-MM-DD');
        }
    }

    /**
     * If the date/time is overridden in the query time, parse and
     * return the forced time.  Otherwise, the
     * current date/time is returned
     * @param req
     * @returns The date as a moment
     */
    static parseTimeOnQuery(req: Request): Moment {
        const t: string = req.query.forceTime as string;
        if (
            t &&
            t.match(
                /(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})\.(\d{3})Z/
            )
        ) {
            return moment(t);
        } else {
            return moment();
        }
    }
}
