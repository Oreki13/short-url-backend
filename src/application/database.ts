import { PrismaClient, Prisma } from "@prisma/client";
import { logger } from "./logger";
import { Sentry } from "./sentry";

// Definisikan tipe untuk event Prisma
type PrismaLogEvent = {
    timestamp: Date;
    message: string;
    target: string;
};

type PrismaQueryEvent = {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
};

// Cek apakah PrismaClient sudah ada di global scope untuk mencegah multiple instances
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Konfigurasi Prisma berdasarkan environment
const getPrismaConfig = () => {
    // Konfigurasi dasar
    const config: Prisma.PrismaClientOptions = {
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
        log: [] // Akan diset berdasarkan environment
    };

    // Konfigurasi logging berdasarkan environment
    if (process.env.NODE_ENV === 'production') {
        // Untuk production, hanya log error dan warning
        config.log = [
            {
                emit: "event",
                level: "error"
            },
            {
                emit: "event",
                level: "warn"
            }
        ];
    } else if (process.env.NODE_ENV === 'test') {
        // Untuk test, minimal logging
        config.log = [
            {
                emit: "event",
                level: "error"
            }
        ];
    } else {
        // Untuk development, log semua
        config.log = [
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
            }
        ];
    }

    return config;
};

// Inisialisasi Prisma client dengan konfigurasi yang sesuai
export const prismaClient = globalForPrisma.prisma || new PrismaClient(getPrismaConfig());

// Setup event handlers berdasarkan environment
if (process.env.NODE_ENV !== 'test') {
    // Error handler untuk semua environment
    prismaClient.$on("error" as never, ((e: PrismaLogEvent) => {
        // Sentry tracking (jika bukan di test environment)
        if (process.env.NODE_ENV !== 'test') {
            Sentry.setContext("database_error", {
                message: e.message,
                target: e.target,
            });
            Sentry.captureException(new Error(`Database error: ${e.message}`));
        }
        logger.error(`Database error: ${e.message}`, { target: e.target });
    }) as never);

    // Warning handler
    prismaClient.$on("warn" as never, ((e: PrismaLogEvent) => {
        if (process.env.NODE_ENV !== 'test') {
            Sentry.setContext("database_warning", {
                message: e.message,
                target: e.target,
            });
        }
        logger.warn(`Database warning: ${e.message}`, { target: e.target });
    }) as never);

    // Log queries hanya di development
    if (process.env.NODE_ENV === 'development') {
        prismaClient.$on("query" as never, ((e: PrismaQueryEvent) => {
            if (process.env.LOG_QUERIES === 'true') {
                logger.debug(`Query: ${e.query}`, {
                    params: e.params,
                    duration: `${e.duration}ms`,
                    target: e.target
                });
            }
        }) as never);
    }

    // Info logs
    prismaClient.$on("info" as never, ((e: PrismaLogEvent) => {
        logger.info(`Database info: ${e.message}`, { target: e.target });
    }) as never);
}

// Simpan PrismaClient ke global scope untuk menghindari multiple instances selama hot-reloading
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient;

// Helper function untuk disconnect dari database, berguna untuk testing
export const disconnectPrisma = async () => {
    if (globalForPrisma.prisma) {
        await globalForPrisma.prisma.$disconnect();
    }
};

// Function untuk reset database (hanya untuk testing)
export const resetDatabase = async () => {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('Database reset is only allowed in test environment');
    }

    // Actual implementation would depend on your application's needs
    // For example, truncating all tables or running specific cleanup
};