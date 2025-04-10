import { logger } from "./application/logger";
import { web } from "./application/web";
import dotenv from "dotenv";
import { setupTokenCleanup } from "./job/token_cleanup_job";

dotenv.config();
const port = process.env.PORT ?? "8080";

// Setup cronjobs
try {
    logger.info('Initializing background jobs...');
    setupTokenCleanup();
    logger.info('Background jobs initialized successfully');
} catch (error) {
    logger.error('Error initializing background jobs', { error });
}

web.listen(port, () => {
    logger.info(`Listening on port ${port}`)
})

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error });
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
});