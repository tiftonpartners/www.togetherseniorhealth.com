require('dotenv').config();
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const {
    videoRouter,
    agoraCallbackRouter,
} = require('../../src/api/video.route');
const request = require('supertest');

const channel = 'Testing-rec';

function sleep(msg, secs) {
    log.info(`Sleeping for ${secs} seconds: ${msg}`);
    return new Promise((resolve) => setTimeout(resolve, secs * 1000));
}

describe('Agora Video Recording - REST API', () => {
    testRooms = [];

    beforeAll(async () => {});

    afterAll(async () => {});

    const app = express();
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Register api routes
    app.use('/api/v1/video', agoraCallbackRouter); // No token authentication for the callback API from Agora
    app.use('/api/v1/video', videoRouter);
    // @ts-ignore
    app.use('*', (req, res) => {
        res.status(404).json({ error: 'resource not found' });
    });

    /**
     * Create a 30 second recording giving the composite mode
     */
    async function doRecording(comp = true, delaySecs = 15) {
        const mode = comp ? 'mix' : 'individual';
        // Aquire + start recording, get a sid
        let response = await request(app)
            .post(`/api/v1/video/agora/record/begin/${channel}/${mode}`)
            .set('Accept', 'application/json')
            .expect(200);
        let { sid } = response.body;
        expect(sid).toBeTruthy();

        await sleep('After Begin', delaySecs);

        // Use the sid to get information about the recording, including
        // recording record and Agora query result
        response = await request(app)
            .get(`/api/v1/video/agora/record/get/${sid}`)
            .set('Accept', 'application/json')
            .expect(200);
        ({ resourceId, sid, uid, composite } = response.body.recording);
        expect(response.body.agora).toBeTruthy();
        expect(resourceId).toBeTruthy();
        expect(sid).toBeTruthy();

        await sleep('After query', delaySecs);

        // Now end the recording
        response = await request(app)
            .post(`/api/v1/video/agora/record/end/${sid}`)
            .set('Accept', 'application/json')
            .expect(200);
        ({ resourceId, sid, uid, composite } = response.body);

        // A final query, after ending the video
        response = await request(app)
            .get(`/api/v1/video/agora/record/get/${sid}`)
            .set('Accept', 'application/json')
            .expect(200);

        expect(response.body.recording).toBeTruthy();
        expect(response.body.agora).toBeFalsy(); // Agora doesn't give query results for closed sessions
    }

    it('should record a current video session - composite', async () => {
        await doRecording(true);
    });

    it('should record a current video session - individual', async () => {
        await doRecording(false);
    });

    it('should retrieve all recordings', async () => {
        await doRecording(true, 2);
        await doRecording(true, 2);

        let response = await request(app)
            .get(`/api/v1/video/agora/record/channel/${channel}`)
            .set('Accept', 'application/json')
            .expect(200);

        const recordings = response.body;
        // log.info('(apiGetRecordingsForChannel) Completed Results:', response.body)
        expect(response.body).toBeTruthy();
    });
});
