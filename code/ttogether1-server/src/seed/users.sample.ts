import { ManagementClient } from 'auth0';
import { UserService } from '../av/user.service';
import {
    ProspectUserModel,
    AVUserModel,
    ProspectLegacyModel,
    AVUser,
    AgoraUser,
    UserLegacyModel,
} from '../db/user.db';
export const sampleUsers = require('./sample-users.json');

const { Logger } = require('../core/logger.service');

const log = Logger.logger('Legacy Users Bootstrapper');

const managementClient = new ManagementClient({
    domain: process.env.AUTH0_DOMAIN as string,
    clientId: process.env.AUTH0_MGMT_API_CLIENT_ID as string,
    clientSecret: process.env.AUTH0_MGMT_API_CLIENT_SECRET as string,
    scope: 'read:users update:users read:grants read:users read:roles',
});

/**
 * Build seed data for users from sample-users json file
 */
export const buildUserSeedData = async () => {
    let changeMade = false;

    if (sampleUsers) {
        const auth0Users = await managementClient.getUsers();
        for (let i = 0; i < sampleUsers.length; i++) {
            const sampleUser = sampleUsers[i];
            const auth0User = auth0Users.find(
                (_authUser) => _authUser.email === sampleUser.email
            );

            if (auth0User) {
                const userLegacy = await UserLegacyModel.findOne({
                    userId: auth0User.user_id,
                });

                if (!userLegacy) {
                    log.debug(`Building legacy user: "${auth0User.user_id}"`);
                    changeMade = true;
                    const user = new UserLegacyModel();

                    // First five are assigned to Research Study
                    Object.assign(user, {
                        userId: auth0User.user_id,
                    });

                    // Incremement manually as hooks are disabled for migration
                    await UserService.setNextUserNumber(user);
                    await user.save();
                }
            }
        }
    }
    const legacyUsers = await UserLegacyModel.find();

    if (changeMade) {
        log.info(
            `***** Changes were made Bootstrapping data. The users database contains ${legacyUsers.length} legacy users`
        );
    } else {
        log.debug('Legacy Users Count:', legacyUsers.length);
        log.info(
            `Not bootstrapping data. The users database contains ${legacyUsers.length} legacy users`
        );
    }
    return;
};
