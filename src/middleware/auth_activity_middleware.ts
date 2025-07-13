import { Request, Response, NextFunction } from 'express';
import { ActivityLogger } from '../helper/activity_logger';
import { UserRequest } from '../type/user_request';
import jwt from 'jsonwebtoken';

/**
 * Middleware to log authentication-related activities
 * This middleware should be applied to auth-related endpoints
 */
export const authActivityMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (body) {
        // Only process successful responses (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const path = req.path;

            try {
                // Parse the response body to get access to data
                const responseBody = typeof body === 'string' ? JSON.parse(body) : body;

                // Handle login success
                if (path.includes('/login') && responseBody.success === true) {
                    // Get user ID from the JWT token in the response
                    const token = responseBody.data?.access_token;
                    if (token) {
                        try {
                            const secret = process.env.SECRET_KEY;
                            const decoded: any = jwt.verify(token, secret!, { algorithms: ['HS256'] });

                            // Log the login activity
                            ActivityLogger.logLogin(decoded.id, req);
                        } catch (error) {
                            console.error('Error decoding JWT for activity logging:', error);
                        }
                    }
                }

                // Handle token refresh
                if (path.includes('/refresh-token') && responseBody.success === true) {
                    const token = responseBody.data?.access_token;
                    if (token) {
                        try {
                            const secret = process.env.SECRET_KEY;
                            const decoded: any = jwt.verify(token, secret!, { algorithms: ['HS256'] });

                            // Log the token refresh activity
                            ActivityLogger.logTokenRefresh(decoded.id, req);
                        } catch (error) {
                            console.error('Error decoding JWT for token refresh logging:', error);
                        }
                    }
                }

                // For authenticated routes that have user in request
                const userReq = req as UserRequest;
                if (userReq.id) {
                    // Handle token revocation
                    if (path.includes('/revoke-token') && responseBody.success === true) {
                        ActivityLogger.logTokenRevoke(userReq.id, req);
                    }
                }
            } catch (error) {
                // Ignore any errors in the activity logging to ensure response is sent
                console.error('Error logging auth activity:', error);
            }
        }

        // Continue with the original send
        return originalSend.call(this, body);
    };

    next();
};
