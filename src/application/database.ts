import {PrismaClient} from "@prisma/client";
import {logger} from "./logger";

export const prismaClient = new PrismaClient({
    log: [
        {
            emit: "event",
            level: "query"
        },
        {
            emit: "event",
            level: "info"
        },
        {
            emit: "event",
            level: "error"
        },
        {
            emit: "event",
            level: "warn"
        },
    ]
});

prismaClient.$on("error", (e) =>{
    Sentry.addBreadcrumb({
        "category": "db-error",
        "message": JSON.stringify(e),
        "level": "error"
    })
    logger.error(JSON.stringify(e))
});
prismaClient.$on("warn", (e)=> {
    Sentry.addBreadcrumb({
        "category": "db-warn",
        "message": JSON.stringify(e),
        "level": "warning"
    })
    logger.warn(JSON.stringify(e))
});
prismaClient.$on("query", (e)=> logger.info(JSON.stringify(e)));
prismaClient.$on("info", (e)=> logger.info(JSON.stringify(e)));