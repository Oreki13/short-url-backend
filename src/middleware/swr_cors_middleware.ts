import { Request, Response, NextFunction } from 'express';

/**
 * Middleware khusus untuk menangani SWR requests
 * SWR sering mengirim headers cache yang memicu pre-flight
 */
export const swrCorsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    // Set CORS headers untuk SWR
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
    }

    // Headers yang sering dikirim SWR
    const swrHeaders = [
        'cache-control',
        'if-none-match',
        'if-modified-since',
        'x-swr-cache-key'
    ];

    // Tambahkan ETag untuk caching SWR
    if (req.method === 'GET') {
        const etag = `"${Date.now()}"`;
        res.header('ETag', etag);

        // Handle conditional requests dari SWR
        if (req.headers['if-none-match'] === etag) {
            return res.status(304).end();
        }
    }

    next();
};