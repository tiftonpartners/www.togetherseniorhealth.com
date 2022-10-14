import { ClassModel } from '../db/class.db';
import {
    ProspectUserModel,
    AVUser,
    AVUserModel,
    AgoraUserModel,
    ProspectUserSchema,
    ProspectLegacyModel,
    UserLegacyModel,
    UserType,
    UserState,
    ParticipantUserModel,
} from '../db/user.db';

const { Logger } = require('../core/logger.service');

const log = Logger.logger('Users Migrations');

/**
 * Migrate seed/current data for users from prospects and users collections
 */
export const migrateUserData = async () => {
    let changeMade = false;

    // finds users from legacy table
    const legacyAgoraUsers = await UserLegacyModel.find();

    if (legacyAgoraUsers) {
        const legacyAgoraUsers$ = legacyAgoraUsers.map(
            async (legacyAgoraUser) => {
                let agoraUserDb = await AgoraUserModel.findOne({
                    userId: legacyAgoraUser.get('userId'),
                });

                if (!agoraUserDb) {
                    log.debug(
                        `Building agora user: "${legacyAgoraUser.get(
                            'userId'
                        )}"`
                    );
                    changeMade = true;
                    let agoraDb = new AgoraUserModel();
                    Object.assign(agoraDb, {
                        ...legacyAgoraUser.toObject(),
                        _id: undefined,
                    });
                    await agoraDb.save();
                }
            }
        );
        await Promise.all(legacyAgoraUsers$);
    }

    // finds prospects from legacy table
    // any legacy user is considered a prospect as they are all included in the prospect collection
    // without any state or types attached
    const legacyProspectUsers = await ProspectLegacyModel.find();
    if (legacyProspectUsers) {
        const legacyProspectUsers$ = legacyProspectUsers.map(
            async (prospectUser) => {
                let avUserDb = await ProspectUserModel.findOne({
                    userId: prospectUser.get('userId'),
                });

                if (!avUserDb) {
                    log.debug(
                        `Building av user: "${prospectUser.get('userId')}"`
                    );
                    changeMade = true;
                    let prospectDb = new ProspectUserModel();
                    Object.assign(prospectDb, {
                        ...prospectUser.toObject(),
                        caregiverRel: 'Family',
                        screenName: prospectUser.screenName
                            ? prospectUser.screenName
                            : prospectUser.firstName +
                              ' ' +
                              prospectUser.lastName,
                        _id: undefined,
                    });
                    await prospectDb.save();
                } else {
                    Object.assign(avUserDb, {
                        ...prospectUser.toObject(),
                        _id: avUserDb._id,
                        userId: avUserDb.userId,
                    });
                    await avUserDb.save();
                }
            }
        );
        await Promise.all(legacyProspectUsers$);
    }

    const programTypeMap = new Map([
        ['Research Study', 'RS'],
        ['Community Class', 'CS'],
        ['Maintenance Class', 'MC'],
        ['Sutter Pilot', 'SUTP'],
        ['Stanford Pilot', 'STANP'],
        ['Other', 'RS'],
    ]);

    const avUsers = await AVUserModel.find();
    if (avUsers) {
        const avUsers$ = avUsers.map(async (avUser) => {
            if (programTypeMap.has(avUser.program)) {
                log.debug(
                    `Updating av user program: "${avUser.get('userId')}"`
                );
                changeMade = true;
                await AVUserModel.findOneAndUpdate(
                    {
                        _id: avUser._id,
                    },
                    {
                        program: programTypeMap.get(avUser.program),
                    },
                    {
                        useFindAndModify: false,
                    }
                );
            }
        });
        await Promise.all(avUsers$);
    }

    const prospectUsers = await ProspectUserModel.find(); // only searching prospects as all users migrated are prospects initially
    const agroraUsers = await AgoraUserModel.find();

    if (changeMade) {
        log.info(
            `***** Changes were made Bootstrapping data. The av-users database contains ${prospectUsers.length} prospect users and the agora-users database contains ${agroraUsers.length} agora users`
        );
    } else {
        log.debug('Prospect Users Count:', prospectUsers.length);
        log.debug('Agora Users Count:', agroraUsers.length);
        log.info(
            `Not bootstrapping data. The av-users database contains ${prospectUsers.length} prospect users and the agora-users database contains ${agroraUsers.length} agora users`
        );
    }
    return;
};

/**
 * Build seed data for users from sample-users json file
 */
export const updateUserClassSeedData = async () => {
    let changeMade = false;

    const classes = await ClassModel.find();

    if (classes) {
        const participantIds = ([] as string[]).concat.apply(
            [],
            classes.map((klass) => klass.participants)
        );
        // Get combined list of users with duplicates removed
        const userIds = Array.from(new Set([...participantIds])); // make unique

        try {
            // Loop all user ids assigned to classes
            for (let i = 0; i < userIds.length; i++) {
                const userId = userIds[i];
                const user = await AVUserModel.findOne({ userId });

                if (user) {
                    // If the user exists and is a prospect, convert it
                    if (user.get('__t') === UserType.Prospect) {
                        const updatedUser = await AVUserModel.findOneAndUpdate(
                            { userId },
                            {
                                __t: UserType.Participant,
                                state: UserState.Assigned,
                            },
                            {
                                new: true,
                                upsert: true,
                                useFindAndModify: false,
                            }
                        );

                        if (updatedUser) {
                            log.debug(
                                `User with id "${userId}" is now an active participant`
                            );
                            changeMade = true;
                        }
                    } else if (user.get('__t') === UserType.Participant) {
                        if (user.state === UserState.NotYetAssigned) {
                            await AVUserModel.findOneAndUpdate(
                                { userId },
                                {
                                    state: UserState.Assigned,
                                },
                                {
                                    new: true,
                                    upsert: true,
                                    useFindAndModify: false,
                                }
                            );

                            log.debug(
                                `User with id "${userId}" is already a participant. Making sure state is correct.`
                            );
                        }
                    }
                } else {
                    log.debug(
                        `User with id "${userId}" was not found in av-users collection`
                    );
                }
            }
        } catch (e) {}
    }
    const participantUsers = await ParticipantUserModel.find({
        state: UserState.Assigned,
    });

    if (changeMade) {
        log.info(
            `***** Changes were made Bootstrapping data. The av-users database now contains ${participantUsers.length} active participant users`
        );
    } else {
        log.debug('Active Participant Users Count:', participantUsers.length);
        log.info(
            `Not bootstrapping data. The av-users database contains ${participantUsers.length} active participant users`
        );
    }
    return;
};
