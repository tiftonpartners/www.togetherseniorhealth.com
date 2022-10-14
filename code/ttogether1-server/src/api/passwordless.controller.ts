import { Request, Response, NextFunction } from 'express';
import { Logger } from '../core/logger.service';
import { AuthController } from './auth.controller';
import {
    PasswordlessRole,
    PasswordlessModel,
    Passwordless,
} from '../db/passwordless.db';
import { Class, ClassDoc, ClassModel } from '../db/class.db';
import { ProspectUserModel } from '../db/user.db';
import { PasswordlessService } from '../service/passwordless.service';
const fs = require('fs');

const moment = require('moment-timezone');
require('moment-recur');
require('dotenv').config();

const log = Logger.logger('PasswordlessController');

/**
 * Controller to implement REST API for Classes in MongoDB
 */
export class PasswordlessController extends AuthController {
    /**
     * Get access ticket for a specific user, given their Auth0 user ID.
     * The ticket is stored in MongoDB, and can be converted to a JWT token
     * later.
     */
    static apiGetUserTicket = async (req: Request, res: Response) => {
        const userId = req.params.userId as string;
        if (!userId) {
            log.debug('(apiGetUserTicket) Missing userId');
            res.status(400).send(
                'ERROR: Missing userId for random user ticket'
            );
            return;
        }

        try {
            const passwordless = (await PasswordlessModel.findOne({
                userId,
            })) as Passwordless;
            let ticket;

            if (passwordless) {
                ticket = passwordless.randomTicket;
            } else {
                // No ticket has been created yet for this user

                ticket = await PasswordlessService.generateRandomUserTicket({
                    // No expiration for the moment validMins: 60,
                    userId: userId,
                });
            }

            res.status(200).json({ ticket: ticket });
        } catch (e) {
            res.status(400).send('ERROR: Unknown userId:' + userId);
        }
    };

    static apigetAVUserTicket = async (
        req: Request<{ userId: string }, any, { screenName: string }>,
        res: Response
    ) => {
        const userId = req.params.userId;
        const screenName = req.body.screenName;
        if (!userId) {
            log.debug('(apigetAVUserTicket) Missing userId');
            res.status(400).send(
                'ERROR: Missing userId for random prospect ticket'
            );
            return;
        }

        const ticket = await PasswordlessService.getAVUserTicket(
            userId,
            screenName
        );
        try {
            res.status(200).json({ ticket: ticket });
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get access ticket for a session, given the acronym for the session.
     * The ticket is stored in MongoDB, and can be converted to a JWT token
     * later.
     */
    static apiGetClassTicket = async (req: Request, res: Response) => {
        // const classAcronym = req.params.classAcronym as string;
        // const nickname = req.query.nickname as string;
        // const externaId = req.query.externalId as string;
        // if (!classAcronym) {
        //     log.debug('(apiGetClassTicket) Missing session');
        //     res.status(400).send(
        //         'ERROR: Missing session for random session ticket'
        //     );
        //     return;
        // }
        // const klass = (await ClassModel.findOne({
        //     acronym: classAcronym,
        // })) as ClassDoc;
        // if (!klass) {
        //     res.status(404).send(
        //         `ERROR: No class for Session Acronym "${classAcronym}"`
        //     );
        //     return;
        // }

        // const ticket = await PasswordlessService.generateRandomClassTicket({
        //     // No expiration for the moment validMins: 60,
        //     classAcronym: classAcronym,
        //     nickname: nickname,
        //     externalId: externaId,
        // });
        // // Signup the participant to the class
        // klass.participants.push(ticket);
        // klass.save();
        // res.status(200).json({ ticket: ticket });
        res.status(403);
    };

    /**
     * Exchange user ticket for a token.  The contents of the token is returned,
     * and depends on the type of ticket
     */
    static apiGetToken = async (req: Request, res: Response) => {
        const ticket = req.params['ticket'];
        if (!ticket) {
            log.debug('(apiGetToken) Missing  ticket');
            res.status(400).send('ERROR: Missing ticket for JWT Token');
            return;
        }
        try {
            const token = await PasswordlessService.generateJwtToken(ticket);
            res.status(200).send({ token: token });
        } catch (e) {
            res.status(e.status || 500).send('ERROR: ' + e.message);
        }
    };

    /**
     * Get attendance for a specific class, given its ID
     */
    static apiGetPublicCert = async (req: Request, res: Response) => {
        res.status(200).send(fs.readFileSync('jwtpasswordless.public.key'));
    };
}
