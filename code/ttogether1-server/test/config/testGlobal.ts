/* Global setup/teardown for use of in-memory MongoDB
 *
 * Setup/teardown happens in two stages during testing via an in-memory
 * MongoDb.  In setup.js/teardown.js, the in-memory database is started/stopped, and
 * connectivity information (db name and uri) is written to a file in JSON format so
 * that we can obtain it here.
 *
 * When the test is run, the global setup/teardown functions in this
 * file are called to build a connection to that database and inject it into
 * the session DAO service.
 *
 * This approach was adapted from
 *   http://man.hubwiz.com/docset/Jest.docset/Contents/Resources/Documents/jest/docs/en/mongodb.html
 * In that approach, the functionality found in this file would be implemented in a custom testEnvironment
 * class (setup in jest.config.js).  However, it does not seem possible to have the testEnvironment
 * be implemented in Typescript (required in order to use MongoClientService).
 *
 * Apparently, Jest is not able to use ts-jest to compile Typescript files
 * implementing setup/teardown/testEnvironment files referenced in jest.config.js. Therefore,
 * the functionality in testEnvironment was moved to this file where it can still be implemented in
 * Typescript
 *
 */

import { MongoClient } from 'mongodb';
import { MongoClientService } from '../../src/api/mongo-client.service';
const fs = require('fs');
const path = require('path');

const mongoConfigPath = path.join(__dirname, 'mongoConfig.json');

export class TestGlobalMongoConfig {
    mongoUri: string = '';
    mongoDBName: string = '';
}

export const mongoGlobalTestSetup = async () => {
    const mongoConfig = JSON.parse(fs.readFileSync(mongoConfigPath, 'utf-8'));
    const mongoClient = await MongoClient.connect(mongoConfig.mongoUri);
    MongoClientService.injectClient(mongoClient);
    return;
};

export const mongoGlobalTestTeardown = async () => {
    await MongoClientService.getClient().close();
};

export const getMongoConfig = () => {
    return JSON.parse(fs.readFileSync(mongoConfigPath, 'utf-8'));
};
