import { UserService } from '../av/user.service';
import { PasswordlessRole } from '../db/passwordless.db';
import {
    AVUserModel,
    ParticipantUserModel,
    UserState,
    AgoraUserModel,
} from '../db/user.db';
import { PasswordlessService } from '../service/passwordless.service';

export const sampleParticipants = require('./sample-participants.json');

const { Logger } = require('../core/logger.service');

const log = Logger.logger('Participant Bootstrapper');

/**
 * Build seed data for participants from json file
 */
export const buildParticipantUserSeedData = async () => {
    let changeMade = false;

    if (sampleParticipants) {
        for (let i = 0; i < sampleParticipants.length; i++) {
            const sampleParticipant = sampleParticipants[i];
            const participantDb = await AVUserModel.findOne({
                sid: sampleParticipant.sid,
            });

            if (!participantDb) {
                log.debug(
                    `Building participant with sid: "${sampleParticipant.sid}"`
                );
                changeMade = true;
                let participant = new ParticipantUserModel();

                const program = sampleParticipant.program
                    ? sampleParticipant.program
                    : i < 5
                    ? 'RS'
                    : 'CC';

                // First five are assigned to Research Study
                Object.assign(participant, {
                    ...sampleParticipant,
                    _id: undefined,
                    state: UserState.NotYetAssigned,
                    program,
                });

                participant = await participant.save();

                const userId = `TSH-Admin|${participant._id}`;
                const ticket = await PasswordlessService.getAVUserTicket(
                    userId,
                    participant.screenName ||
                        participant.firstName + ' ' + participant.lastName,
                    PasswordlessRole.User
                );

                participant.userId = userId;
                participant.ticket = ticket;
                await participant.save();

                // First five are recorded as agora users
                if (i < 5) {
                    const userLegacy = await AgoraUserModel.findOne({
                        userId,
                    });

                    if (!userLegacy) {
                        log.debug(`Building agora user: "${userId}"`);
                        const user = new AgoraUserModel();

                        Object.assign(user, {
                            userId,
                        });

                        // Incremement manually as hooks are disabled for migration
                        await UserService.setNextUserNumber(user);
                        await user.save();
                    }
                }
            } else {
                Object.assign(participantDb, {
                    ...sampleParticipant,
                });

                await participantDb.save();
            }
        }
    }
    const participantUsers = await ParticipantUserModel.find();

    if (changeMade) {
        log.info(
            `***** Changes were made Bootstrapping data. The av-users database contains ${participantUsers.length} participant users`
        );
    } else {
        log.debug('Participants Count:', participantUsers.length);
        log.info(
            `Not bootstrapping data. The av-users database contains ${participantUsers.length} participant users`
        );
    }
    return;
};
