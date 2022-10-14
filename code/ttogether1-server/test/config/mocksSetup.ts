const sgMail = require('@sendgrid/mail');
import { jest } from '@jest/globals';
import { TestUserService } from '../utility/test-users.service';
import { UserInfo, UserService } from '../../src/av/user.service';
import { Auth0Token, TshToken } from '../../src/api/token.types';
import {
    Passwordless,
    PasswordlessModel,
    PasswordlessRole,
    TicketType,
} from '../../src/db/passwordless.db';
import crypto from 'crypto';
import base64url from 'base64url';
import { Role, User } from 'auth0';
import { PasswordlessService } from '../../src/service/passwordless.service';

const spy9 = jest.spyOn(sgMail, 'setApiKey');
spy9.mockReturnValue(true);

const spy = jest.spyOn(UserService, 'getUserRolesById');
spy.mockResolvedValue([
    {
        id: 'role',
        name: 'role',
    } as Role,
]);
const spy2 = jest.spyOn(UserService, 'getAuth0Users');
spy2.mockResolvedValue(TestUserService.getAllTestUsers());

const spy6 = jest.spyOn(UserService, 'getAuth0UsersByIds');
spy6.mockImplementation((ids: string[]) => {
    const users = ids.map((id) =>
        TestUserService.getTestUserById(id)
    ) as User[];

    return Promise.resolve(users);
});

const spy8 = jest.spyOn(UserService, 'fetchAuth0Info');
spy8.mockImplementation(async (userInfo: UserInfo) => {
    const uid = userInfo.userId.toLowerCase();
    if (
        uid.startsWith('auth0') ||
        uid.startsWith('google') ||
        uid.startsWith('email')
    ) {
        // mocking auth0 stuff
        const user = TestUserService.getTestUserById(userInfo.userId);
        userInfo.setUserData(user);
    } else {
        // Do we have a passwordless ticket for them?
        const passwordless: Passwordless = (await PasswordlessModel.findOne({
            userId: userInfo.userId,
        })) as Passwordless;

        if (passwordless) {
            // Its a passwordless user.
            const usr = {
                name: passwordless.name,
                user_id: userInfo.userId,
                nickname: passwordless.name,
                username: passwordless.name,
            };
            userInfo.setUserData(usr);
        }
    }

    return userInfo;
});

const spy4 = jest.spyOn(PasswordlessService, 'generateRandomUserTicket');
spy4.mockImplementation(
    async ({
        userId,
        validMins,
        now,
    }: {
        userId: string;
        validMins?: number;
        now?: Date;
    }): Promise<string> => {
        const rec: Passwordless = new PasswordlessModel() as Passwordless;
        const createdOn = now?.getTime() || Date.now();
        const expiresOn = new Date(
            validMins ? createdOn + validMins * 60 * 1000 : 8640000000000000
        );

        const user = TestUserService.getTestUserById(userId);

        if (!user) {
            throw new Error(`User not found for user id: ${userId}`);
        }

        Object.assign(rec, {
            randomTicket: base64url(crypto.randomBytes(48)),
            userId: userId,
            nickname: user.nickname,
            name: user.name,
            picture: '/',
            role: PasswordlessRole.User.toString(),
            validMins: validMins ? validMins : 8640000000000000 / 60 / 1000,
            createdOn: createdOn,
            expiresOn: expiresOn,
            ticketType: TicketType.User,
        });
        await rec.save();
        return Promise.resolve(rec.randomTicket);
    }
);
