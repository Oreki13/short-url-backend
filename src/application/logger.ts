import winston from "winston";

export const logger = winston.createLogger({
    format: winston.format.json(),
    level: 'info',
    transports: [
        new winston.transports.Console({}),
    ]
})

