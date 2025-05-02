// src/middleware/audit_log.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../application/logger';
import { UserRequest } from '../type/user_request';

export const auditLogMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const userReq = req as UserRequest;
    const startTime = Date.now();

    // Capture response
    const originalSend = res.send;
    res.send = function (body) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        logger.info(`API Access`, {
            user_id: userReq.id || 'anonymous',
            method: req.method,
            url: req.originalUrl,
            ip: req.ip || req.socket.remoteAddress,
            status_code: res.statusCode,
            response_time: responseTime,
            user_agent: req.headers['user-agent']
        });

        return originalSend.call(this, body);
    };

    next();
};