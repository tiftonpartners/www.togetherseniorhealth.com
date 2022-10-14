import * as jest from 'jest';
import { Logger } from '../src/core/logger.service';

const log = Logger.logger('TestInit');
// globalSetup
async function init() {
    log.info('Initialization');

    // Do all your initialization stuff
    // I use a setTimeout to simulate true async
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            log.info('Init finished');
            resolve();
        }, 1000);
    });
}

// globalTeardown
async function afterTests() {
    log.info('End of tests - Execute something');
}

// @ts-ignore
init().then(jest.run)
    .then(afterTests)
    .catch((e: any) => log.error(e));
