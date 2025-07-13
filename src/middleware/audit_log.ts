import { Request, Response, NextFunction } from 'express';
import { logger } from '../application/logger';
import { UserRequest } from '../type/user_request';
import { ActivityLogger } from '../helper/activity_logger';
import { ActivityType } from '../model/user_activity_model';

// Define routes that should be audited in the activity log
// Format: { method, path, activityType, resourceIdParam }
const AUDITED_ROUTES = [
    { method: 'POST', path: /^\/api\/v1\/short\/?$/, activityType: ActivityType.CREATE_SHORT_LINK, resourceIdField: 'id' },
    { method: 'PUT', path: /^\/api\/v1\/short\/[a-zA-Z0-9-]+\/?$/, activityType: ActivityType.UPDATE_SHORT_LINK, resourceIdParam: 'id' },
    { method: 'DELETE', path: /^\/api\/v1\/short\/[a-zA-Z0-9-]+\/?$/, activityType: ActivityType.DELETE_SHORT_LINK, resourceIdParam: 'id' },
    { method: 'POST', path: /^\/api\/v1\/domain\/?$/, activityType: ActivityType.CREATE_DOMAIN, resourceIdField: 'id' },
    { method: 'PUT', path: /^\/api\/v1\/domain\/[a-zA-Z0-9-]+\/?$/, activityType: ActivityType.UPDATE_DOMAIN, resourceIdParam: 'id' },
    { method: 'DELETE', path: /^\/api\/v1\/domain\/[a-zA-Z0-9-]+\/?$/, activityType: ActivityType.DELETE_DOMAIN, resourceIdParam: 'id' },
    { method: 'PUT', path: /^\/api\/v1\/user\/profile\/?$/, activityType: ActivityType.UPDATE_PROFILE },
    { method: 'PUT', path: /^\/api\/v1\/user\/password\/?$/, activityType: ActivityType.CHANGE_PASSWORD },
];

export const auditLogMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Skip audit logging for OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
        return next();
    }

    const userReq = req as UserRequest;
    const startTime = Date.now();
    const url = req.originalUrl;
    const method = req.method;

    // Capture response
    const originalSend = res.send;
    res.send = function (body) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Standard request logging
        logger.info(`API Access`, {
            user_id: userReq.id || 'anonymous',
            method: req.method,
            url: req.originalUrl,
            ip: req.ip || req.socket.remoteAddress,
            status_code: res.statusCode,
            response_time: responseTime,
            user_agent: req.headers['user-agent'],
        });

        // Only log successful responses (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300 && userReq.id) {
            // Check if this route should be recorded in activity log
            for (const route of AUDITED_ROUTES) {
                if (method === route.method && route.path.test(url)) {
                    let resourceId: string | undefined;

                    // Extract resource ID from parameters or response body
                    if (route.resourceIdParam && req.params[route.resourceIdParam]) {
                        resourceId = req.params[route.resourceIdParam];
                    } else if (route.resourceIdField && body) {
                        try {
                            const responseBody = JSON.parse(body);
                            if (responseBody.data && responseBody.data[route.resourceIdField]) {
                                resourceId = responseBody.data[route.resourceIdField];
                            }
                        } catch (error) {
                            // Ignore parsing errors
                        }
                    }

                    // Determine resource type based on URL
                    let resourceType: string | undefined;
                    if (url.includes('/short')) resourceType = 'DataUrl';
                    else if (url.includes('/domain')) resourceType = 'Domain';
                    else if (url.includes('/user')) resourceType = 'User';

                    // Log the activity asynchronously
                    ActivityLogger.logFromRequest(
                        userReq.id,
                        route.activityType,
                        req,
                        `User performed ${route.activityType}`,
                        resourceId,
                        resourceType
                    ).catch(error => {
                        logger.error('Failed to log activity', { error, userId: userReq.id });
                    });

                    break;
                }
            }
        }

        return originalSend.call(this, body);
    };

    next();
};