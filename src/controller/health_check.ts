import { Request, Response } from 'express';
import { getTokenCleanupStatus } from '../job/token_cleanup_job';

class HealthController {
    static async check(req: Request, res: Response) {
        // Collect status from all jobs
        const jobStatuses = {
            token_cleanup: getTokenCleanupStatus(),
            // Add other jobs here
        };

        // Overall status is healthy if all jobs are healthy
        const isHealthy = Object.values(jobStatuses).every(status => status.healthy === true);

        res.status(isHealthy ? 200 : 500).json({
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            jobs: jobStatuses
        });
    }
}

export default HealthController;