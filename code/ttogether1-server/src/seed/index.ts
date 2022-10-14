require('dotenv').config();
import { MongoClientService } from '../api/mongo-client.service';
import { buildSeedData } from './build-seed-data';
const mongoose = require('mongoose');
const { Logger } = require('../core/logger.service');

const log = Logger.logger('SeedData');

(async () => {
    try {
        const uri = MongoClientService.getUri();
        await mongoose.connect(uri, { useNewUrlParser: true });
        log.info(
            'Mongoose connected to the database using URI:',
            MongoClientService.getSafeUri()
        );
        await buildSeedData();
        process.exit();
    } catch (e) {
        log.info('ERROR Building Sample Data:', e.message);
        process.exit(1);
    }
})();
