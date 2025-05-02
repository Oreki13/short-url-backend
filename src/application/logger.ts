import winston from "winston";
import Transport from "winston-transport";
import { format } from 'winston';
import axios from 'axios';

// Customize log format
const customFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
);

// For console output, nice formatting for development
const consoleFormat = format.combine(
    format.colorize(),
    format.timestamp({ format: 'HH:mm:ss' }),
    format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
            }`;
    })
);

// Create a custom transport to send logs to API
class ApiLoggerTransport extends Transport {
    constructor(opts?: Transport.TransportStreamOptions) {
        super(opts);
    }

    log(info: any, callback: () => void) {
        // Only send error and fatal logs to API
        if (info.level === 'error' || info.level === 'fatal') {
            if (process.env.ENABLE_LOGGER_API === 'true' && process.env.LOGGER_API_DOMAIN && process.env.NODE_ENV !== 'test') {
                const apiUrl = `${process.env.LOGGER_API_DOMAIN}/api/v1/logs/telegram`;

                // Format the error message
                const errorMessage = typeof info.message === 'string'
                    ? info.message
                    : JSON.stringify(info.message);
                const message = {
                    message: errorMessage,
                    level: info.level,
                    timestamp: info.timestamp,
                }

                // Prepare payload
                const payload = {
                    service: process.env.NODE_ENV + "." + process.env.APP_NAME + "@" + process.env.APP_VERSION || 'shorturl-backend',
                    message: JSON.stringify(message),
                };

                // Send log to API
                axios.post(apiUrl, payload)
                    .catch(error => {
                        console.error('Failed to send log to API:', error.message);
                    });
            }
        }

        this.emit('logged', info);
        callback();
    }
}

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    defaultMeta: { service: process.env.APP_NAME || 'shorturl-backend' },
    transports: [
        // Write all logs to console
        new winston.transports.Console({
            format: process.env.NODE_ENV === 'production' ? customFormat : consoleFormat
        }),

        // Write important logs to file for production
        ...(process.env.NODE_ENV === 'production' ? [
            new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                maxsize: 10485760, // 10MB
                maxFiles: 5,
            }),
            new winston.transports.File({
                filename: 'logs/combined.log',
                maxsize: 10485760, // 10MB,
                maxFiles: 5,
            })
        ] : []),

        // API Logger Transport - always add but only triggers on error/fatal when ENABLE_LOGGER_API=true
        new ApiLoggerTransport({
            level: 'error'
        })
    ]
});