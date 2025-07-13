import { Request, Response, NextFunction } from 'express';
import { ActivityLogger } from '../helper/activity_logger';
import { UserRequest } from '../type/user_request';
import { ActivityType } from '../model/user_activity_model';

/**
 * Middleware for tracking UI-related user activities
 * This middleware can be extended to track specific UI actions if needed
 * 
 * Note: This is a placeholder for future UI activity tracking.
 * Currently it will just pass through without tracking anything.
 * Extend this middleware as needed for UI-specific tracking.
 */
export const uiActivityMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Implementation can be added later for UI-specific activities
    // This is a placeholder for future UI tracking needs
    next();
};

/**
 * Helper function to track a specific UI action
 * @param actionType The type of UI action
 * @param requiresAuth Whether authentication is required
 * @returns Middleware function
 */
export const trackUiAction = (description: string, requiresAuth: boolean = true) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userReq = req as UserRequest;

        // Only track for authenticated users if authentication is required
        if (requiresAuth && !userReq.id) {
            return next();
        }

        // Track the UI action asynchronously - don't block the request
        if (userReq.id) {
            ActivityLogger.logFromRequest(
                userReq.id,
                ActivityType.UI_ACTION as any, // This would need to be added to the ActivityType enum
                req,
                description
            ).catch(error => {
                console.error('Failed to log UI activity:', error);
            });
        }

        next();
    };
};
