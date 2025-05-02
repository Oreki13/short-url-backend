import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: process.env.NODE_ENV === 'test' ? 1000 : 5, // Increase limit for tests
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "ERROR",
        code: "TOO_MANY_AUTH_ATTEMPTS",
        message: "Too many authentication attempts, please try again later"
    },
    skipSuccessfulRequests: false,
    // Skip rate limiting entirely in test environment
    skip: (req) => process.env.NODE_ENV === 'test'
});