/**
 * Tests for the Agora Service
 */
require('dotenv').config();
const { Logger, LogLevel } = require('../../src/core/logger.service');
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const {
    mongoGlobalTestSetup,
    mongoGlobalTestTeardown,
    getMongoConfig,
} = require('../config/testGlobal');
const bodyParser = require('body-parser');
const { videoRouter } = require('../../src/api/video.route');
const request = require('supertest');
const { AgoraClientService } = require('../../src/av/agora-client.service');
const { AuthenticationClient } = require('auth0');
const { buildSeedData } = require('../../src/seed/course.sample');
var jwt = require('jsonwebtoken');

// Map the deprecated sessions to new
// session acronyms
const SessionNames = [
    'MTSTANDG1-201005',
    'MTSTANDG2-201006',
    'MTSITG1-201007',
    'MTSITG2-201006',
];

var auth0 = new AuthenticationClient({
    domain: process.env.AUTH0_CUSTOM_DOMAIN,
    clientId: process.env.AUTH0_MGMT_API_CLIENT_ID,
    clientSecret: process.env.AUTH0_MGMT_API_CLIENT_SECRET,
});

let authInfo = null;
let tokenDecoded = null;

describe('Agora Video - REST API', () => {
    testRooms = [];

    beforeAll(async () => {
        try {
            mongoConfig = await getMongoConfig();
            await mongoGlobalTestSetup();
            await mongoose.connect(mongoConfig.mongoUri, {
                useNewUrlParser: true,
                useCreateIndex: true,
                poolSize: 2,
            });
            db = mongoose.connection;
            db.on('error', log.error.bind(console, 'connection error:'));
            db.once('open', function () {
                log.debug("we're connected!");
            });

            authInfo = await auth0.passwordGrant({
                username: process.env.INSTRUCTOR_1,
                password: process.env.INSTRUCTOR_1_PASSWORD,
            });
            tokenDecoded = jwt.decode(authInfo.id_token, { complete: true });
        } catch (e) {
            log.info('BeforeAll Error:', e);
        }
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await mongoGlobalTestTeardown();
    });

    const app = express();
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Register api routes
    app.use('/api/v1/video', videoRouter);
    // @ts-ignore
    app.use('*', (req, res) => {
        res.status(404).json({ error: 'not found' });
    });

    // Create some sample sessions
    beforeEach(async () => {
        await buildSeedData(LogLevel.Info);
    });

    afterEach(async () => {
        if (mongoose && mongoose.connection && mongoose.connection.db) {
            mongoose.connection.db.dropDatabase();
        }
    });

    it('should retrieve agora token for an existing session', async () => {
        const sessionId = SessionNames[0];
        const uid = 100;
        let response = await request(app)
            .get(`/api/v1/video/agora/token/${sessionId}`)
            .query({ uid: uid })
            .set({
                Accept: 'application/json',
                authorization: 'Bearer ' + authInfo.id_token,
            })
            .send()
            .expect(200);
        const token = response.body.token;
        expect(token.length).toBeGreaterThanOrEqual(139);
        expect(response.body.room).toBeTruthy();
        expect(response.body.room.acronym).toEqual(sessionId);
    });

    it('should error for non-existing session', async () => {
        const sessionId = SessionNames[0] + 'bogus';
        let response = await request(app)
            .get(`/api/v1/video/agora/token/${sessionId}`)
            .set({
                Accept: 'application/json',
                authorization: 'Bearer ' + authInfo.id_token,
            })
            .send()
            .expect(404);
    });

    it('should error for missing sessionId', async () => {
        let response = await request(app)
            .get(`/api/v1/video/agora/token`)
            .set({
                Accept: 'application/json',
                authorization: 'Bearer ' + authInfo.id_token,
            })
            .send()
            .expect(404);
    });
});
