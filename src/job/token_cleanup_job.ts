import { CronJob } from 'cron';
import { prismaClient } from '../application/database';
import { logger } from '../application/logger';
import { Sentry, SentryCore } from '../application/sentry';

// State variables for monitoring
let lastRunTime = new Date(0);
let consecutiveFailures = 0;
let isRunning = false;
const maxConsecutiveFailures = 3;

export function setupTokenCleanup() {
    if (process.env.DISABLE_TOKEN_CLEANUP === 'true') {
        logger.info('Token cleanup job is disabled via environment variable');
        return;
    }

    const cronTime = process.env.TOKEN_CLEANUP_SCHEDULE ||
        (process.env.NODE_ENV === 'development' ? '* * * * *' : '0 0 * * *');

    logger.info(`Initializing token cleanup job with schedule: ${cronTime}`);
    const scheduleWithCheckIn = SentryCore.cron.instrumentCron(CronJob, "Token Cleanup Job");

    // Run job
    const job = new scheduleWithCheckIn(cronTime, async () => {
        if (isRunning) {
            logger.warn('Token cleanup job is already running, skipping this execution');
            return;
        }

        isRunning = true;
        const jobStartTime = new Date();


        // Create a span instead of a transaction (new Sentry API)
        const span = Sentry.startSpan({
            op: "cron.token-cleanup",
            name: "Token Cleanup Job",
            attributes: {
                cronJob: "token_cleanup",
                scheduled: cronTime
            }
        }, (span) => span);

        try {
            logger.info(`Running token cleanup job at ${jobStartTime.toISOString()}`);

            // Set attributes on the span
            span?.setAttributes({
                'token_cleanup.last_run': lastRunTime.toISOString(),
                'token_cleanup.current_run': jobStartTime.toISOString()
            });



            const result = await prismaClient.token.deleteMany({
                where: {
                    OR: [
                        { expires_at: { lt: new Date() } }, // Delete expired tokens
                        { is_revoked: true } // Delete revoked tokens
                    ]
                }
            });

            // Record job success
            lastRunTime = new Date();
            consecutiveFailures = 0;

            // Set attributes for the result metrics (new API)
            span?.setAttributes({
                'token_cleanup.tokens_cleaned': result.count,
                'token_cleanup.duration_ms': new Date().getTime() - jobStartTime.getTime()
            });

            logger.info(`Token cleanup job completed successfully. Cleaned up ${result.count} tokens in ${new Date().getTime() - jobStartTime.getTime()}ms`);

        } catch (error) {
            consecutiveFailures++;
            const errorMessage = error instanceof Error ? error.message : String(error);

            // Log the error
            logger.error(`Token cleanup job failed: ${errorMessage}`, { error });

            // Set status to error and capture exception
            span?.setStatus({
                code: 2,
                message: errorMessage
            });


            Sentry.captureException(error, {
                tags: {
                    job_name: "token_cleanup",
                },
                contexts: {
                    cleanup_job: {
                        consecutive_failures: consecutiveFailures,
                    }
                }
            });

            // Send alert if too many failures
            if (consecutiveFailures >= maxConsecutiveFailures) {
                logger.error(`Token cleanup job has failed ${consecutiveFailures} times consecutively`);
                Sentry.captureMessage(`Token cleanup job has failed ${consecutiveFailures} times consecutively`, {
                    level: "fatal"
                });
            }
        } finally {
            // End the span (equivalent to transaction.finish())
            span?.end();
            isRunning = false;
        }
    });

    // Add job information to monitor status
    job.addCallback(() => {
        logger.debug(`Next token cleanup job scheduled for: ${job.nextDate().toString()}`);
    });

    job.start();
    logger.info(`Token cleanup job started. Next execution: ${job.nextDate().toString()}`);
}

// Export a function to check job health for health endpoints
export function getTokenCleanupStatus() {
    return {
        last_execution: lastRunTime,
        last_execution_timestamp: lastRunTime.getTime(),
        is_running: isRunning,
        healthy: consecutiveFailures < maxConsecutiveFailures,
        consecutive_failures: consecutiveFailures,
        max_failures_threshold: maxConsecutiveFailures
    };
}