require('moment-recur');
require('dotenv').config();
const jwt = require('jsonwebtoken');
import mongoose from 'mongoose';
import moment from 'moment';
import { getMongoConfig, TestGlobalMongoConfig } from '../config/testGlobal';
import { PasswordlessRole, TicketType } from '../../src/db/passwordless.db';
import { PasswordlessService } from '../../src/service/passwordless.service';

const userId = 'auth0|5f1766ac965b8c0019fe78d8';
let mongoConfig = new TestGlobalMongoConfig();

describe('PasswordlessService Tests', () => {
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

    it('Should get permissions for passwordless users', async () => {
        const perms = await PasswordlessService.getPwdlessParticipantPerms(
            PasswordlessRole.User
        );
        expect(perms.length).toBeGreaterThanOrEqual(1);
        expect(perms.includes('queryMe:session')).toBeTruthy();
    });

    it('Should return Encoded JWT token with User ID', async () => {
        const randomToken = await PasswordlessService.generateRandomUserTicket({
            validMins: 60,
            userId: userId,
        });
        const jwtTokenStr = await PasswordlessService.generateJwtToken(
            randomToken
        );
        const jwtToken = jwt.decode(jwtTokenStr, { complete: true });
        // log.info("jwtToken", JSON.stringify(jwtToken, null, 2));
        expect(jwtToken).toBeTruthy();
        expect(jwtToken.header).toBeTruthy();
        expect(jwtToken.payload).toBeTruthy();
        expect(jwtToken.payload.gty).toEqual('pwdless');
        expect(jwtToken.payload.sub).toEqual(userId);
        expect(jwtToken.payload.tty).toEqual(TicketType.User);
        expect(jwtToken.payload.role).toEqual(PasswordlessRole.User);
        expect(jwtToken.payload.permissions.length).toBeGreaterThanOrEqual(3);
        expect(jwtToken.signature).toBeTruthy();
    });

    it('Should Fail due to expired random ticket', async () => {
        const randomTicket = await PasswordlessService.generateRandomUserTicket(
            {
                validMins: 60,
                userId: userId,
            }
        );
        // One minute past expiration
        const now = moment().add(61, 'm');
        try {
            const token = await PasswordlessService.generateJwtToken(
                randomTicket,
                now.toDate()
            );
        } catch (e) {
            // We expected this!
            expect(e.message).toContain('expired');
            return;
        }
        throw 'Failed to get expected exception for expired token';
    });

    it('Should Fail due to invalid ticket', async () => {
        const randomTicket = await PasswordlessService.generateRandomUserTicket(
            {
                validMins: 60,
                userId: userId,
            }
        );
        try {
            const token = await PasswordlessService.generateJwtToken(
                randomTicket + '~'
            );
        } catch (e) {
            // We expected this!
            expect(e.message).toContain('Ticket not found');
            return;
        }
        throw 'Failed to get expected exception for invalid token';
    });
});
