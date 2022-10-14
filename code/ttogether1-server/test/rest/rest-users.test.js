require('dotenv').config();
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const { userRouter } = require('../../src/api/user.route');
const request = require('supertest');
const { AuthenticationClient } = require('auth0');
var jwt = require('jsonwebtoken');

var auth0 = new AuthenticationClient({
    domain: process.env.AUTH0_CUSTOM_DOMAIN,
    clientId: process.env.AUTH0_MGMT_API_CLIENT_ID,
    clientSecret: process.env.AUTH0_MGMT_API_CLIENT_SECRET,
});

let authInfo = null;
let tokenDecoded = null;

describe('User ID Assignment - REST API', () => {
    beforeAll(async () => {
        authInfo = await auth0.passwordGrant({
            username: process.env.INSTRUCTOR_1,
            password: process.env.INSTRUCTOR_1_PASSWORD,
        });
        tokenDecoded = jwt.decode(authInfo.id_token, { complete: true });
    });

    afterAll(async () => {});

    const app = express();
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Register api routes
    app.use('/api/v1/users', userRouter);
    // @ts-ignore
    app.use('*', (req, res) => {
        res.status(404).json({ error: 'not found' });
    });

    it('should retrieve existing user by number', async () => {
        let response = await request(app)
            .get(`/api/v1/users/me`)
            .set({
                Accept: 'application/json',
                authorization: 'Bearer ' + authInfo.id_token,
            })
            .expect(200);

        let userInfo = response.body;
        // log.info('userInfo:', userInfo)
        const id1 = userInfo.userId;
        response = await request(app)
            .get(`/api/v1/users/${userInfo.userNumber}`)
            .set({
                Accept: 'application/json',
                authorization: 'Bearer ' + authInfo.id_token,
            })
            .expect(200);

        userInfo = response.body.userInfo;
        const id2 = userInfo.userInfo;
        expect(id1).toEqual(id2);
    });

    it("should retrieve current user's info", async () => {
        // log.info('authInfo:', JSON.stringify(authInfo, null, 2), 'idToken:', JSON.stringify(tokenDecoded, null, 2))
        let response1 = await request(app)
            .get(`/api/v1/users/me`)
            .set({
                Accept: 'application/json',
                authorization: 'Bearer ' + authInfo.id_token,
            })
            .expect(200);

        const body = response1.body;
        expect(body).toBeTruthy();
        expect(body.permissions).toBeTruthy();
        expect(body.roles).toBeTruthy();
        expect(body.permissions.length).toBeGreaterThanOrEqual(1);
        expect(body.roles.length).toBeGreaterThanOrEqual(1);
    });
});
