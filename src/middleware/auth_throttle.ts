import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 5, // batas 5 percobaan dalam 15 menit
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "ERROR",
        code: "TOO_MANY_AUTH_ATTEMPTS",
        message: "Too many authentication attempts, please try again later"
    },
    skipSuccessfulRequests: false
});