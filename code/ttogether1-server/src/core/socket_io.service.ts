import { Server } from 'http';
import moment from 'moment';
import {
    EventClass,
    EventType,
    GlobalEvent,
    RecordingState,
    SessionStateService,
} from '../av/session-state.service';
import SessionType from '../db/session.db';
import { GaTelemetry } from './ga_telemetry';
import { Socket } from 'socket.io';
import { Logger } from './logger.service';
import { MutexObject } from './mutex';
import { RedisService } from './redis.service';

const json_parser = require('socket.io-json-parser');
const socketio = require('socket.io');
const redisAdapter = require('socket.io-redis');

const log = Logger.logger('Socket_io');

export interface ISocketIOMetrics {
    bytes_recv: number;
    bytes_sent: number;
    msgs_sent: number;
    msgs_recv: number;
    n_sockets_opened: number;
    n_connects: number;
    n_disconnects: number;
}

/**
 * Single client connection handler.
 */
class SioConnectionHandler {
    socket: Socket;
    telemetry: GaTelemetry;
    last_heartbeat_ts: number = 0;
    hb_control_int: NodeJS.Timeout | undefined = undefined;
    in_msg_mutex: MutexObject = new MutexObject();

    constructor(socket: Socket, telemetry: GaTelemetry) {
        this.socket = socket;
        this.telemetry = telemetry;

        socket.on('disconnect', () => {
            log.info(`(socket, id:${socket.id}) disconnected`);
            if (this.hb_control_int) {
                clearInterval(this.hb_control_int);
                this.hb_control_int = undefined;
            }

            this.telemetry
                .publishEvent({
                    name: 'be_socket_connect',
                    params: { event_value: 0 },
                })
                .then();
        });

        socket.on('message', async (eventIn: GlobalEvent) => {
            try {
                // make message processing sequential
                await this.in_msg_mutex.acquire();
                await this.onAppEvent(socket, eventIn);
            } catch (err) {
                log.error(
                    `failed to acquire mutex on SessionStateService or process event: ${err}`
                );
            } finally {
                this.in_msg_mutex.release();
            }
        });

        this.telemetry
            .publishEvent({
                name: 'be_socket_connect',
                params: { event_value: 1 },
            })
            .then();

        // launch heartbeats
        const hb_interval = Number(process.env.SRV_HB_INTERVAL ?? 0);
        if (hb_interval !== 0) {
            this.hb_control_int = setInterval(async () => {
                // check prev heartbeat was replied
                if (this.last_heartbeat_ts !== 0) {
                    log.warn(
                        `the heartbeat was not replied for socket:${this.socket}, expected:${this.last_heartbeat_ts}`
                    );
                }

                // send new heartbeat
                const evt = new GlobalEvent(
                    EventClass.Notify,
                    EventType.Heartbeat
                );
                this.last_heartbeat_ts = Date.now();
                evt.target = `${this.last_heartbeat_ts}`;
                this.socket.emit('message', evt);
            }, hb_interval * 1000);
        }
    }

    async onAppEvent(socket: Socket, eventIn: GlobalEvent) {
        log.info(`(socket, id:${socket.id}) IN : ${JSON.stringify(eventIn)}`);
        await this.telemetry.publishEvent({
            name: 'be_total_in_msgs',
            params: { ...eventIn },
        });

        // check heartbeat replies
        if (eventIn.event === EventType.HeartbeatReply) {
            const replied_hb = Number(eventIn.target);
            if (
                replied_hb !== this.last_heartbeat_ts &&
                this.last_heartbeat_ts !== 0
            ) {
                log.warn(
                    `late heartbeat response for socket:${this.socket}, expected:${this.last_heartbeat_ts}, received:${replied_hb}`
                );
            }
            this.last_heartbeat_ts = 0;
            return;
        }

        //
        // application level handler(s)
        //
        await SessionStateService.onSocketEvent(socket, eventIn);
    }
}

/**
 * socket.io server
 */
export class SocketIoService {
    httpServer: Server;
    telemetry: GaTelemetry;
    io: any = null;
    metrics: ISocketIOMetrics;
    client_handlers: SioConnectionHandler[] = [];

    public notifySession(evt: GlobalEvent) {
        this.io.sockets.to(evt.sessionId).emit('message', evt);
    }

    public constructor(http_server: Server, ga_telemetry: GaTelemetry) {
        this.httpServer = http_server;
        this.telemetry = ga_telemetry;
        this.metrics = {
            bytes_recv: 0,
            bytes_sent: 0,
            msgs_recv: 0,
            msgs_sent: 0,
            n_connects: 0,
            n_disconnects: 0,
            n_sockets_opened: 0,
        };
        setInterval(async () => {
            await this.publishPerfMetrics();
        }, 15000);

        const options = {
            parser: json_parser,
        };
        this.io = socketio(this.httpServer, options);
        if (RedisService._().isAvailable()) {
            this.io.adapter(
                redisAdapter(RedisService._().uri(), { key: 'tog_sess_sio.' })
            );
        }

        this.io.on('connection', async (socket: any) => {
            await this.setupNewConnection(socket);
        });
    }

    async publishPerfMetrics() {
        const events = Object.entries(this.metrics).map(([key, value]) => {
            return {
                name: `be_socket_io_perf_${key}`,
                params: { event_value: value },
            };
        });
        await this.telemetry.publishEvents(events);
    }

    async setupNewConnection(socket: Socket) {
        log.info(`(socket, id:${socket.id}) connected`);

        this.setupSocketEmitMiddleware(socket);

        socket.on('disconnect', () => {
            this.metrics.n_disconnects += 1;
            this.metrics.n_sockets_opened -= 1;
        });

        socket.on('message', async (eventIn: GlobalEvent) => {
            this.metrics.msgs_recv += 1;
            this.metrics.bytes_recv += SocketIoService.dataLen(eventIn);
        });

        this.metrics.n_connects += 1;
        this.metrics.n_sockets_opened += 1;

        this.client_handlers.push(
            new SioConnectionHandler(socket, this.telemetry)
        );
    }

    setupSocketEmitMiddleware(socket: Socket) {
        const blacklisted_events = new Set([
            'error',
            'connect',
            'disconnect',
            'disconnecting',
            'newListener',
            'removeListener',
        ]);

        const orig_emit = socket.emit;
        socket.emit = (event: string, ...data: any[]) => {
            log.info(
                `(socket, id:${socket.id}) OUT : ${JSON.stringify([
                    event,
                    ...data,
                ])}`
            );
            if (!blacklisted_events.has(event)) {
                this.metrics.msgs_sent += 1;
                this.metrics.bytes_sent += SocketIoService.dataLen(data);

                this.telemetry
                    .publishEvent({
                        name: 'be_total_out_msgs',
                        params: { ...data },
                    })
                    .then();
            }
            return orig_emit.apply(socket, [event, ...data]);
        };
    }

    private static dataLen(data: any): number {
        try {
            return Buffer.byteLength(
                typeof data === 'string' ? data : JSON.stringify(data) || '',
                'utf8'
            );
        } catch (e) {
            return 0;
        }
    }
}
