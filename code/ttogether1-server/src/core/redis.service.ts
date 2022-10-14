require('dotenv').config();
import { createClient } from 'redis';
import { Logger } from './logger.service';

const log = Logger.logger('RedisService');

/**
 * Small redis wrapper.
 */
export class RedisService {
    private static _main_instance: RedisService | undefined = undefined;

    private main_redis_cnn: any = undefined;

    public static _(): RedisService {
        if (RedisService._main_instance === undefined) {
            RedisService._main_instance = new RedisService();
        }
        return RedisService._main_instance;
    }

    public async init() {
        if (this.isAvailable()) {
            log.info(`connecting redis:${this.uri()}`);
            this.main_redis_cnn = createClient({
                url: this.uri(),
            });
            this.main_redis_cnn.on('error', (err: any) =>
                log.error(`Redis Client Error: ${err}`)
            );
            await this.main_redis_cnn.connect();
            log.info(`Redis Client connected`);
        }
    }

    public uri(): string {
        return process.env.REDIS_URL ?? '';
    }

    public isAvailable(): boolean {
        return this.uri().length > 0;
    }

    public async get(key: string): Promise<any | undefined> {
        let serialized = await this.main_redis_cnn.get(key);
        return serialized === null ? undefined : JSON.parse(serialized);
    }

    public async put(key: string, val: any) {
        return await this.main_redis_cnn.set(key, JSON.stringify(val));
    }

    public async del(key: string) {
        return await this.main_redis_cnn.del(key);
    }
}
