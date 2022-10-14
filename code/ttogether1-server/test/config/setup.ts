import { Logger } from '../../src/core/logger.service';
import { TestUserService } from '../utility/test-users.service';

const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

const mongoConfigPath = path.join(__dirname, 'mongoConfig.json');

const mongod = new MongoMemoryServer({
    autoStart: false,
});

const log = Logger.logger('TestConfigSetup');

module.exports = async () => {
    if (!mongod.isRunning) {
        await mongod.start();
        log.info('Starting MongoDB in-memory');
    }

    const mongoConfig = {
        mongoDBName: 'jest',
        mongoUri: await mongod.getUri(),
    };
    // Write global config to disk because all tests run in different contexts.
    fs.writeFileSync(mongoConfigPath, JSON.stringify(mongoConfig));

    // Set reference to mongod in order to close the server during teardown.
    // @ts-ignore
    global._mongod = mongod;
    // @ts-ignore
    global._mongoConfig = mongoConfig;
    // @ts-ignore
    global.UserService = {
        getAuth0Users: Promise.resolve(TestUserService.getAllTestUsers()),
        getUserRolesById: Promise.resolve([
            {
                id: 'role',
                name: 'role',
            },
        ]),
    };
};
