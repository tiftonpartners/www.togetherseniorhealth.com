require('moment-recur');
require('dotenv').config();
import mongoose from 'mongoose';
import moment from 'moment';
import permissions from '../../src/api/permissions.middleware';
import { Request, Response } from 'express';
import { getMongoConfig, TestGlobalMongoConfig } from '../config/testGlobal';

// This is a sample Token generated by Auth0
const token =
    'Bearer: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik5LRnJxdlhMbUVnaHpSY000YVh0YyJ9.eyJodHRwczovL3QxLnRzaC5jb20vbmlja25hbWUiOiJ0ZXN0MSIsImh0dHBzOi8vdDEudHNoLmNvbS9uYW1lIjoiVGVzdCBVc2VyIE9uZSIsImh0dHBzOi8vdDEudHNoLmNvbS9waWN0dXJlIjoiaHR0cHM6Ly9zLmdyYXZhdGFyLmNvbS9hdmF0YXIvOThhZWY0M2FmZTM1Mjg4M2EwMThiM2MwNDM0NmQ5MDM_cz00ODAmcj1wZyZkPWh0dHBzJTNBJTJGJTJGY2RuLmF1dGgwLmNvbSUyRmF2YXRhcnMlMkZ0ZS5wbmciLCJodHRwczovL3QxLnRzaC5jb20vcHJvZ3JhbXMiOiIqIiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5kZXYudHNoLmNhcmUvIiwic3ViIjoiYXV0aDB8NWZjNTUxNjhiMzI4YzkwMDY5NTdmM2QyIiwiYXVkIjoiaHR0cHM6Ly9tdDEtYXBpLmRldi50c2guY2FyZSIsImlhdCI6MTYxOTgxMjAxMiwiZXhwIjoxNjE5ODk4NDEyLCJhenAiOiJkV1RlSkc1SUNWeFRNOUF3cUthZ0YyVElkQmR6YU14ciIsInBlcm1pc3Npb25zIjpbImdldDpwcm9zcGVjdCIsInF1ZXJ5OnNlc3Npb24iLCJ0ZXN0OnNlc3Npb24iXX0.kgNkcQzjGTpQLwyy_R3EjyimwF36Z57k4pXqpv89BA8LxXFjNiMldwQ6mkoRY8be_Y9GApL52mv2j_Unb_yZhBue_7KyK7mY7LiNypRt9B2gW8ClZFyh_rdmnMtt3dKbjHpB2S33_6QeRo0_nDX3xBDiRhw1Yi9S-BSY9e-f13lOG4MltILmQcWzHGVpQie38na5V9JxMSGNMXxo-CPOHbxVCqNGNrZY-dd9_TMMGczvG7nk-apRdoNuyw66As2QOCAF-9UiD_NQOFHQsxEAYAZoqUyxLTONzVg_TKZ61P6dGrZ3iMrZVfj9tee5xmJvvm14TLYyY6RpBOkleYwg-A';

// Create a fake request
const mockRequest = (sessionData?: any, body?: any) =>
    ({
        session: { data: sessionData },
        headers: {
            authorization: token,
        },
        body,
    } as unknown as Request<{}, {}, {}, {}>);

// Create a fake response
class mockResponse {
    statusCode: number;
    jsonData: any;

    constructor() {
        this.statusCode = 200;
        this.jsonData = {};
    }
    status(code: number) {
        this.statusCode = code;
        return this;
    }
    json(data: any) {
        this.jsonData = data;
    }
}

const mockNext = () => {
    const next = jest.fn();
    return next;
};

let mongoConfig = new TestGlobalMongoConfig();

describe('Permissions Middleware Tests', () => {
    beforeEach(async () => {
        mongoConfig = await getMongoConfig();
        await mongoose.connect(mongoConfig.mongoUri, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
        });
        await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    afterEach(async () => {
        if (mongoose && mongoose.connection && mongoose.connection.db) {
            await mongoose.connection.db.dropDatabase();
        }
        await mongoose.connection.close();
    });

    it('should restrict access to routes to users (must have ALL permissions)', async () => {
        const req = mockRequest();
        const res = new mockResponse() as unknown as Response;
        const next = mockNext();

        const isAllowedTest = permissions('apiGetClassBySessionAcronym');
        await isAllowedTest(req, res, next);
        expect(res.statusCode).toEqual(403);

        const req2 = mockRequest();
        const res2 = new mockResponse() as unknown as Response;
        const next2 = mockNext();
        const isAllowedTest2 = permissions('apiGetSchedule');
        await isAllowedTest2(req2, res2, next2);
        expect(next2).toHaveBeenCalledTimes(1);
    });

    it('should restrict access to routes to users (must have at least ONE permission)', async () => {
        const req = mockRequest();
        const res = new mockResponse() as unknown as Response;
        const next = mockNext();

        const isAllowedTest = permissions('apiGetParticipantById');
        await isAllowedTest(req, res, next);
        expect(res.statusCode).toEqual(403);

        const req2 = mockRequest();
        const res2 = new mockResponse() as unknown as Response;
        const next2 = mockNext();
        const isAllowedTest2 = permissions('apiGetAVUserById');
        await isAllowedTest2(req2, res2, next2);
        expect(next2).toHaveBeenCalledTimes(1);
    });
});