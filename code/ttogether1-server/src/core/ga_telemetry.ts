//
// Google Analytics telemetry gathering module.
// Sends host resource load to GA.
//
// Depends on env variables: GA_MEASUREMENT_ID, GA_API_SECRET
//
import si from 'systeminformation';
import axios from 'axios';
import { Logger } from './logger.service';

export interface IGaEvent {
    name: string;
    params: any;
}

const log = Logger.logger('GaTelemetry');

/**
 * Google Analytics telemetry sync.
 */
export class GaTelemetry {
    measurement_id: string = '';
    api_secret: string = '';

    constructor() {
        this.measurement_id = process.env.GA_MEASUREMENT_ID ?? '';
        this.api_secret = process.env.GA_API_SECRET ?? '';
    }

    /**
     * Start metrics gathering which is done on timer basis.
     */
    public run() {
        // check the 'feature-flag'
        if (this.api_secret === '') {
            log.warn('GaTelemetry - no api_secret is set, not starting');
            return;
        }

        // starting
        setInterval(async () => {
            await this.publishSysInfoTelemetry();
        }, 15000);
    }

    /**
     * Immediate publish of event.
     * We can think of batching a bit later.
     *
     * @param event - event in GA understanding { name: 'event-name', params : { prop1: val1, ...} }
     * @returns
     */
    public async publishEvent(event: IGaEvent) {
        await this.publishEvents([event]);
    }

    public async publishEvents(events: IGaEvent[]) {
        if (this.api_secret === '') {
            return;
        }

        try {
            await axios.post(
                `https://www.google-analytics.com/mp/collect?measurement_id=${this.measurement_id}&api_secret=${this.api_secret}`,
                {
                    client_id: '0000000001.0000000001',
                    user_id: '0000000001.0000000001',
                    events: events,
                }
            );
        } catch (e) {
            log.warn('failed to publish Google Analytics, reason:', e);
        }
    }

    async publishSysInfoTelemetry() {
        const stats = await si.currentLoad();
        const nodejs_mem = process.memoryUsage();

        await this.publishEvents([
            {
                name: 'be_sys_info_avg_cpu',
                params: { value: stats.avgLoad },
            },
            {
                name: 'be_sys_info_cu_cpu',
                params: { value: stats.currentLoadUser },
            },
            {
                name: 'be_sys_info_nodejs_heap_used',
                params: { value: nodejs_mem.heapUsed },
            },
            {
                name: 'be_sys_info_nodejs_heap_total',
                params: { value: nodejs_mem.heapTotal },
            },
            {
                name: 'be_sys_info_nodejs_rss',
                params: { value: nodejs_mem.rss },
            },
        ]);
    }
}
