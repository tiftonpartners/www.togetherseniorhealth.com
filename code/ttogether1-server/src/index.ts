/**
 * main module
 */
import { RedisService } from './core/redis.service';

require('dotenv').config(); //< this import should be the first for local devenv to work
import { GaTelemetry } from './core/ga_telemetry';

import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { MongoClientService } from './api/mongo-client.service';
import { sessionsStateRouter } from './api/session-state.route';
import { agoraCallbackRouter, videoRouter } from './api/video.route';
import { qosRouter } from './api/qos.route';
import { userRouter } from './api/user.route';
import { hubspotRouter } from './api/hubspot.route';
import * as http from 'http';
import * as fs from 'fs';

import { courseRouter } from './api/course.route';
import { classRouter } from './api/class.route';
import { attendanceRouter } from './api/attendance.route';
import { passwordlessRouter } from './api/passwordless.route';
import { programRouter } from './api/program.route';
import { buildSeedData } from './seed/build-seed-data';
import * as pkg from '../package.json';

import { SessionStateService } from './av/session-state.service';
import { Logger } from './core/logger.service';
import { adhocSessionRouter } from './api/adhoc-session.route';
import { classMusicRouter } from './api/class-music.route';
import { notificationsRouter } from './api/notification.route';
import { NotificationService } from './service/notification.service';
import { EmailType } from './db/email-ledger.db';
import { SocketIoService } from './core/socket_io.service';

let moment = require('moment-timezone');
const cron = require('node-cron');
const expressjwt = require('express-jwt');
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const mongoose = require('mongoose');

export const app: Application = express();

// Map the deprecated sessions to new
// session acronyms
const SessionMap = new Map([
    ['Testing1', 'MTSTANDG1-201005'],
    ['Testing2', 'MTSTANDG2-201006'],
    ['Testing3', 'MTSITG1-201007'],
    ['Testing4', 'MTSITG2-201006'],
]);

/**
 * main
 */
(async () => {
    const app_log = Logger.appLogger();

    app_log.info(`Moving Together Server version ${pkg.version}`);

    // setup telemetry
    const ga_telemetry = new GaTelemetry();
    ga_telemetry.run();

    // ensure redis is running
    await RedisService._().init();

    app_log.info(
        `Session State Management Debugging is ${process.env.SESSION_MGMT_DEBUG}`
    );

    const sessionMgmtSchedule: string =
        process.env.SESSION_MGMT_SCHEDULE || '30 0,15,30,45 * * * *';
    app_log.info(`Session Management Schedule:"${sessionMgmtSchedule}"`);
    const dailyClassReminderEmailSchedule: string | undefined =
        process.env.EMAIL_DAILY_CLASS_REMINDER_SCHEDULE || undefined;
    app_log.info(
        `Daily Class Reminder Email Schedule:"${
            dailyClassReminderEmailSchedule || 'Disabled'
        }"`
    );
    app_log.info(
        `PERMISSIONS_AUTH_ENABLED: ${process.env.PERMISSIONS_AUTH_ENABLED}`
    );
    app_log.info(`EMAIL_TO_REGEX:' ${process.env.EMAIL_TO_REGEX}'`);

    app_log.info(`NODE_ENV:'${process.env.NODE_ENV}'`);

    app.use(cors());
    process.env.NODE_ENV !== 'production' && app.use(morgan('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.set('etag', false); // Disable caching

    /*   app.use(expressWinston.logger({
      transports: [
        new winston.transports.Console()
      ],
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json()
      ),
      meta: false, // optional: control whether you want to log the meta data about the request (default to true)
      msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
      expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
      colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
      ignoreRoute: function (req: any, res: any) { return false; } // optional: allows to skip some log messages based on request and/or response
    }));
   */
    // Connect up the Mongo Database
    app_log.info(
        `(db) Connecting to database with URI: "${MongoClientService.getSafeUri()}" ...`
    );
    try {
        const uri = MongoClientService.getUri();
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useCreateIndex: true,
            connectTimeoutMS: 20000,
            useUnifiedTopology: true,
        });
        app_log.info('(db)... connected.');
    } catch (e) {
        app_log.error(`(db) Cannot connect to the database:${e}`);
        process.abort();
    }

    await buildSeedData();

    // Set up Auth0 configuration
    const authConfig = {
        clientId: process.env.AUTH0_MGMT_API_CLIENT_ID as string,
        customDomain: process.env.AUTH0_CUSTOM_DOMAIN as string,
        domain: process.env.AUTH0_DOMAIN as string,
        audience: process.env.AUTH0_TOGETHER1_API_AUDIENCE as string,
    };

    // Define middleware that validates incoming bearer tokens
    // using JWKS from YOUR_DOMAIN
    const checkJwt = expressjwt({
        secret: jwksRsa.expressJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
            jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`,
        }),

        audience: authConfig.audience,
        issuer: `https://${authConfig.customDomain}/`,
        algorithms: ['RS256'],
        userProperty: 'userToken',
    });

    const publicKey = fs.readFileSync('jwtpasswordless.public.key');

    // This is a wrapper around the checkJwt middleware provided by Auth0.
    // The wrapper checks for our custom token and uses that for authentication.
    // If that fails, it will delegate to the Auth0 middleware
    //
    function checkJwtWrapper(req: Request, res: Response, next: NextFunction) {
        // @ts-ignore
        if (req.headers && req.headers.authorization) {
            // @ts-ignore
            const token = req.headers.authorization;
            let parts = token.split(' ');
            if (parts.length == 2 && /^Bearer$/i.test(parts[0])) {
                var scheme = parts[0];
                var credentials = parts[1];
                try {
                    // Try to verify as a Passwordless token.
                    var tokenVerified = jwt.verify(parts[1], publicKey, {
                        algorithm: 'RS256',
                        complete: true,
                    });
                    app_log.info(
                        `Passwordless login as userId: ${tokenVerified.payload.sub}`
                    );
                    next();
                } catch {
                    // Not a passwordless token, Trying Auth0
                    // Use this if you need to see the token:
                    var tokenDecoded = jwt.decode(parts[1], { complete: true });
                    app_log.info(
                        `Not a passwordless token, Trying Auth0, decoded JWT Token for subject: ${tokenDecoded.payload.sub}`
                    );
                    checkJwt(req, res, next);
                }
            } else {
                // @ts-ignore
                res.status(401).send('Bearer Token Required');
            }
        } else {
            next({ status: 401, message: 'No Authorization Token Found' });
        }
    }

    // Register api routes
    app.use('/api/v1/adhoc-sessions', checkJwtWrapper, adhocSessionRouter);
    app.use('/api/v1/session-state', checkJwtWrapper, sessionsStateRouter);
    app.use('/api/v1/video', agoraCallbackRouter); // No token authentication for the callback API from Agora
    app.use('/api/v1/video', checkJwtWrapper, videoRouter);
    app.use('/api/v1/qos', qosRouter);
    app.use('/api/v1/users', checkJwtWrapper, userRouter);
    app.use('/api/v1/courses', checkJwtWrapper, courseRouter);
    app.use('/api/v1/classes', checkJwtWrapper, classRouter);
    app.use('/api/v1/attendance', checkJwtWrapper, attendanceRouter);
    app.use('/api/v1/pwdless', passwordlessRouter); // No authentication require ATM
    app.use('/api/v1/music', checkJwtWrapper, classMusicRouter);
    app.use('/api/v1/notifications', notificationsRouter);
    app.use('/api/v1/programs', programRouter);

    // the special one for HubSpot integration
    app.use('/api/v1/hs', hubspotRouter);

    app.use('*', (req, res) => {
        res.status(404).json({ error: 'not found' });
    });

    const rateLimit = require('express-rate-limit');

    app.set('trust proxy', 1);

    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
    });

    // only apply to requests that begin with /api/
    app.use('/api/', apiLimiter);

    //
    //initialize the http/WebSocket server instance
    //
    const server = http.createServer(app);

    const socket_io_server = new SocketIoService(server, ga_telemetry);

    let port = process.env.PORT;
    if (port == null || port == '') {
        port = '4000';
    }
    server.listen(port, () => {
        app_log.info(`listening on port ${port}`);
    });

    // SessionState
    //
    await SessionStateService.injectDependencies(
        socket_io_server,
        ga_telemetry
    );

    //
    // housekeeping
    //
    cron.schedule(sessionMgmtSchedule, async () => {
        // Look for recordings that need started/stopped,
        // or sessions to delete
        const events = await SessionStateService.manageSessions();
        events.forEach((evt) => {
            app_log.info(
                `(evt) OUTBOUND from manageSessions to session: ${
                    evt.sessionId
                }, event: ${JSON.stringify(evt)}`
            );
            socket_io_server.notifySession(evt);
        });
    });

    // Only schedule reminder email if env has a schedule set
    if (dailyClassReminderEmailSchedule) {
        cron.schedule(
            dailyClassReminderEmailSchedule,
            async () => {
                const batchId = `batch-${moment().unix()}`;
                app_log.info(
                    'Sending reminder emails: daily class, tomorrow class reminder emails, tomorrow ad hoc session reminder emails'
                );

                await Promise.all([
                    NotificationService.sendNotification({
                        emailType: EmailType.DailyClassReminder,
                        batchId,
                    }),
                    NotificationService.sendNotification({
                        emailType: EmailType.TomorrowClassReminder,
                        now: moment().add(1, 'day'),
                        batchId,
                    }),
                    NotificationService.sendNotification({
                        emailType: EmailType.DailyAdHocSessionReminder,
                        now: moment().add(1, 'day'),
                        batchId,
                    }),
                ]);
            },
            {
                timezone: 'America/Los_Angeles',
            }
        );
    }

    await SessionStateService.cleanupOrphanedSessions();
})();
