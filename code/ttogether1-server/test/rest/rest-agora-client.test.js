require('dotenv').config();
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const { agoraCallbackRouter } = require('../../src/api/video.route');
const request = require('supertest');

/* var auth0 = new AuthenticationClient({
  domain: process.env.AUTH0_CUSTOM_DOMAIN,
  clientId: process.env.AUTH0_MGMT_API_CLIENT_ID,
  clientSecret: process.env.AUTH0_MGMT_API_CLIENT_SECRET,
});

let authInfo = null
let tokenDecoded = null
let token = ''
 */

describe('Agora Video Callback - REST API', () => {
    testRooms = [];

    beforeAll(async () => {});

    afterAll(async () => {});

    const app = express();
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Register api routes
    app.use('/api/v1/video', agoraCallbackRouter);
    // @ts-ignore
    app.use('*', (req, res) => {
        res.status(404).json({ error: 'not found' });
    });

    const sample = {
        noticeID: 'XXXX',
        produceId: 2,
        eventType: 1,
        notifyMS: 1567497295000,
        payload: {
            cname: 'Testing2',
            uid: '1001',
            sid: 'dkfjkdjfkdfjdkjfdka;lkeiojfasdfasdfasdfasdf',
            sequence: 0,
            details: {},
        },
    };
    const sampleJSON = JSON.stringify(sample, null, 0);

    it('should return success on valid JSON', async () => {
        let response = await request(app)
            .post(`/api/v1/video/agora/callback`)
            .set('Accept', 'application/json')
            .send(sampleJSON)
            .expect(200);
        const success = response.body.success;
        expect(success).toBeTruthy();
    });
});
