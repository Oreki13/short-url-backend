import { Request, Response, NextFunction } from 'express';

/**
 * Enhanced CORS middleware for better Next.js compatibility
 * This middleware provides additional CORS handling beyond the main cors middleware
 */
export const enhancedCorsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    // Always set Vary header for proper caching
    res.setHeader('Vary', 'Origin');

    // Handle development origins more permissively
    if (process.env.NODE_ENV === 'development') {
        // Allow all localhost and 127.0.0.1 origins in development
        if (origin && (
            origin.startsWith('http://localhost') ||
            origin.startsWith('http://127.0.0.1') ||
            origin.startsWith('http://localhost:3000') ||
            origin.startsWith('http://127.0.0.1:3000') ||
            origin.startsWith('https://localhost') ||
            origin.startsWith('https://127.0.0.1')
        )) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
    }

    // Ensure preflight requests are handled properly
    if (req.method === 'OPTIONS') {
        // Set additional headers for preflight requests
        res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
            'X-CSRF-Token',
            'X-API-Key',
            'Cache-Control',
            'Pragma'
        ].join(', '));

        // End preflight request immediately
        return res.status(204).end();
    }

    // For actual requests, ensure CORS headers are present
    if (origin) {
        // Ensure Access-Control-Expose-Headers is set for frontend to access custom headers
        res.setHeader('Access-Control-Expose-Headers', [
            'X-CSRF-Token',
            'X-RateLimit-Limit',
            'X-RateLimit-Remaining',
            'X-RateLimit-Reset'
        ].join(', '));
    }

    next();
};

/**
 * CORS error handler middleware
 * Specifically handles CORS-related errors with helpful messages
 */
export const corsErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Check if error is CORS-related
    if (err.message && err.message.includes('CORS')) {
        const origin = req.headers.origin;

        return res.status(403).json({
            status: "ERROR",
            code: "CORS_ERROR",
            message: `CORS policy: The origin '${origin}' is not allowed. Please configure ALLOWED_ORIGINS environment variable.`,
            data: {
                origin: origin,
                allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                needsCredentials: true,
                helpUrl: 'Check doc/cors-nextjs-guide.md for configuration help'
            }
        });
    }

    // Pass other errors to the next error handler
    next(err);
};

/**
 * Middleware to log CORS requests for debugging
 */
export const corsDebugMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
        const origin = req.headers.origin;
        const method = req.method;

        if (origin) {
            console.log(`🌐 CORS Request: ${method} ${req.path} from origin: ${origin}`);

            const userAgent = req.headers['user-agent'] || '';
            if (userAgent.includes('SWR') || req.headers['x-swr-cache-key']) {
                console.log('🔄 SWR Request detected');
            }

            // Log preflight requests specifically
            if (method === 'OPTIONS') {
                const requestMethod = req.headers['access-control-request-method'];
                const requestHeaders = req.headers['access-control-request-headers'];
                console.log(`   ↳ Preflight: Method=${requestMethod}, Headers=${requestHeaders}`);
            }
        }
    }

    next();
};

