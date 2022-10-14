require('dotenv').config();
import { Logger } from '../core/logger.service';
import { MongoClientService } from '../api/mongo-client.service';

const TICKETS_COLLECTION = 'tickets';
const dbName = process.env.DB_NAME as string;

const log = Logger.logger('UserTickets');

(async () => {
    // Connect up the Mongo Database
    log.info('Connecting to database...');
    try {
        const client = await MongoClientService.connect();
        log.info('... connected.');

        const coll = MongoClientService.getClient()
            .db(dbName)
            .collection(TICKETS_COLLECTION);
        const agg = [
            {
                $match: {
                    ticketType: 'user',
                },
            },
            {
                $project: {
                    _id: 0,
                    nickname: '$nickname',
                    userId: '$userId',
                    ticket: '$randomTicket',
                },
            },
            {
                $sort: {
                    nickname: 1,
                },
            },
        ];

        coll.aggregate(agg, (cmdErr, result) => {
            if (cmdErr) {
                log.error('ERROR getting user tickets:', cmdErr);
                return;
            }
            result.toArray((err, documents) => {
                if (err) {
                    log.error('ERROR getting user tickets:', err);
                }
                log.info(JSON.stringify(documents, null, 2));
            });
        });

        log.debug('Done querying user tickets');
    } catch (e) {
        log.info('Cannot connect to the database:', e.message);
        process.abort();
    }
})();
