require('dotenv').config();
import { MongoClientService } from '../api/mongo-client.service';
// @ts-ignore
import { buildUserSeedData } from './users.sample';
import { buildProspectUserSeedData } from './prospects.sample';
import {
    buildBetaClassSeedData,
    buildCourseSeedData,
    buildBotClassSeedData,
    buildMaintClassSeedData,
    buildIosClassSeedData,
} from './course.sample';
import { buildSampleAdHocSessions } from './adhoc-sessions.sample';
import { migrateUserData, updateUserClassSeedData } from './users.migrate';
import { buildParticipantUserSeedData } from './participants.sample';
import { buildProgramSeedData } from './program.sample';
import { migrateProgramData } from './programs.migrate';
const mongoose = require('mongoose');
const { Logger } = require('../core/logger.service');

const log = Logger.logger('SeedData');
/**
 * Build all seed data specified in the SEED_DATA environment variable
 * variable
 */
export async function buildSeedData() {
    log.debug('(buildSeedData) Checking');
    if (process.env.SEED_DATA && process.env.SEED_DATA.length > 0) {
        // Load seed data
        for (const seedData of process.env.SEED_DATA.split(',')) {
            log.info('(seed) Seeding Data:', seedData);

            switch (seedData.toUpperCase()) {
                case 'COURSES':
                    await buildCourseSeedData(null);
                    break;
                case 'MAINTCLASS':
                    await buildMaintClassSeedData();
                    break;
                case 'BETACLASS1':
                    await buildBetaClassSeedData();
                    break;
                case 'ADHOC':
                    await buildSampleAdHocSessions();
                    break;
                case 'USERS':
                    await buildUserSeedData();
                    break;
                case 'PROSPECTS':
                    await buildProspectUserSeedData();
                    break;
                case 'PARTICIPANTS':
                    await buildParticipantUserSeedData();
                    break;
                case 'MIGRATE_USERS':
                    await migrateUserData();
                    break;
                case 'MIGRATE_PROGRAMS':
                    await migrateProgramData();
                    break;
                case 'BOT_CLASS':
                    await buildBotClassSeedData();
                    break;
                case 'ACTIVE_PARTICIPANTS':
                    await updateUserClassSeedData();
                    break;
                case 'PROGRAMS':
                    await buildProgramSeedData();
                    break;
                case 'IOS_CLASS':
                    await buildIosClassSeedData();
                    break;
                case 'ALL':
                    await buildProgramSeedData();
                    await buildUserSeedData();
                    await buildProspectUserSeedData();
                    await buildParticipantUserSeedData();
                    await migrateUserData();
                    await buildCourseSeedData(null);
                    await buildSampleAdHocSessions();
                    await buildBotClassSeedData();
                    await buildIosClassSeedData();
                    await buildMaintClassSeedData();
                    await buildBetaClassSeedData();
                    await migrateProgramData();
                    await updateUserClassSeedData();
                    break;
                default:
                    log.error(
                        `(seed) ERROR: Unknown seed data type ${seedData.toUpperCase()}`
                    );
            }
        }
    } else {
        log.debug('(buildSeedData) No data to seed');
    }
}
