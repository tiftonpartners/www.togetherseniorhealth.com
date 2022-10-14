import { PasswordlessController } from '../api/passwordless.controller';
import { UserService } from '../av/user.service';
import {
    ProspectUserModel,
    AVUserModel,
    ProspectLegacyModel,
    AVUser,
    UserLegacyModel,
} from '../db/user.db';
import { PasswordlessService } from '../service/passwordless.service';
export const sampleProspects = require('./sample-prospects.json');

const { Logger } = require('../core/logger.service');

const log = Logger.logger('Legacy Prospect Bootstrapper');

/**
 * Build seed data for users from json file
 */
export const buildProspectUserSeedData = async () => {
    let changeMade = false;

    if (sampleProspects) {
        for (let i = 0; i < sampleProspects.length; i++) {
            const sampleProspect = sampleProspects[i];
            const legacyProspectDb = await ProspectLegacyModel.findOne({
                sid: sampleProspect.sid,
            });

            if (!legacyProspectDb) {
                log.debug(
                    `Building legacy prospect with sid: "${sampleProspect.sid}"`
                );
                changeMade = true;
                let prospect = new ProspectLegacyModel();

                const program = sampleProspect.program
                    ? sampleProspect.program
                    : i < 5
                    ? 'RS'
                    : 'CC';

                // First five are assigned to Research Study
                Object.assign(prospect, {
                    ...sampleProspect,
                    _id: undefined,
                    program,
                });

                prospect = await prospect.save();

                const userId = `TSH-Admin|${prospect._id}`;
                const ticket = await PasswordlessService.getAVUserTicket(
                    userId,
                    prospect.screenName ||
                        prospect.firstName + ' ' + prospect.lastName
                );

                prospect.userId = userId;
                prospect.ticket = ticket;
                await prospect.save();

                // First five are recorded as agora users
                if (i < 5) {
                    const userLegacy = await UserLegacyModel.findOne({
                        userId,
                    });

                    if (!userLegacy) {
                        log.debug(`Building legacy user: "${userId}"`);
                        const user = new UserLegacyModel();

                        Object.assign(user, {
                            userId,
                        });

                        // Incremement manually as hooks are disabled for migration
                        await UserService.setNextUserNumber(user);
                        await user.save();
                    }
                }
            } else {
                Object.assign(legacyProspectDb, {
                    ...sampleProspect,
                });

                legacyProspectDb.save();
            }
        }
    }
    const legacyProspectUsers = await ProspectLegacyModel.find();

    if (changeMade) {
        log.info(
            `***** Changes were made Bootstrapping data. The prospects database contains ${legacyProspectUsers.length} legacy prospect users`
        );
    } else {
        log.debug('Legacy Prospects Count:', legacyProspectUsers.length);
        log.info(
            `Not bootstrapping data. The prospect database contains ${legacyProspectUsers.length} legacy prospect users`
        );
    }
    return;
};
