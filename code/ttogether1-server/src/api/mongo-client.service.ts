import { MongoClient } from 'mongodb';
import { Logger } from '../core/logger.service';

const port = process.env.DB_PORT || 8000;
const dbHost: string = process.env.DB_HOST as string;
const dbUsername: string = process.env.DB_USERNAME as string;
const dbPassword: string = process.env.DB_PASSWORD as string;
const dbName = process.env.DB_NAME as string;
const uri = `mongodb+srv://${dbUsername}:${dbPassword}@${dbHost}/${dbName}`;
const uriSafe = `mongodb+srv://${dbUsername}:<password>@${dbHost}/${dbName}`;

const log = Logger.logger('MongoClientService');

export class MongoClientService {
    private static client: MongoClient | undefined;

    // Given a client that is already connected, replace the
    // existing client with the new one.
    // This is useful for testing purposes
    static injectClient(client: MongoClient) {
        MongoClientService.client = client;
    }

    // Get an instance of a MongoClient already
    // connected to the database
    static getClient(): MongoClient {
        // @ts-ignore
        return MongoClientService.client;
    }

    /**
     * Get URI for database connection
     */
    static getUri(): string {
        return uri;
    }

    /**
     * Get "Safe" URI - uri without the password
     */
    static getSafeUri(): string {
        return uriSafe;
    }

    // Connect to the database given parameters from the environment
    // Remember the connection for reuse
    static async connect(): Promise<MongoClient> {
        log.info(`MongoClientService, URL: ${uriSafe}`);

        return MongoClient.connect(uri, {
            useNewUrlParser: true,
            poolSize: 10,
            wtimeout: 2500,
            connectTimeoutMS: 20000,
            useUnifiedTopology: true,
            readConcern: 'linearizable',
        }).then((client) => {
            MongoClientService.client = client;
            return Promise.resolve(client);
        });
    }
}
