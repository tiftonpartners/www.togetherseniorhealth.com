/**
 * Winstone-based logger system with the possibility of registering custom outputs.
 */

import { createLogger, format, transports } from 'winston';

export class Logger {
    /**
     * Service level logger.
     * @param service_name - name of the service
     * @returns the logger
     */
    static logger(service_name: string) {
        return createLogger({
            level: 'debug',
            defaultMeta: { service: service_name },
            format: format.combine(
                format.splat(),
                format.colorize(),
                format.timestamp(),
                format.align(),
                format.printf(({ level, message, service, timestamp }) => {
                    return `${timestamp} [${level}]: [${service}]: ${message}`;
                })
            ),
            transports: [new transports.Console()],
        });
    }

    /**
     * @returns Main application logger, from [index.ts]
     */
    static appLogger() {
        const app_logger = Logger.logger('App');

        app_logger.exceptions.handle(new transports.Console());
        app_logger.exitOnError = true;
        app_logger.rejections.handle(new transports.Console());

        return app_logger;
    }
}
