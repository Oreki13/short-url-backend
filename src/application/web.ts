require("./sentry");
import express, { Express } from "express";
import helmet from "helmet";
import bodyParser from "body-parser";
import router from "../route/root";
import { errorMiddleware } from "../middleware/error_middleware";
import cors from "cors";
import { Sentry } from "./sentry";
import ErrorController from "../controller/error";
import rateLimit from 'express-rate-limit';
import http from 'http';
import { auditLogMiddleware } from "../middleware/audit_log"
import cookieParser from 'cookie-parser';
import lusca from 'lusca';
import session from 'express-session';
import { csrfTokenMiddleware } from "../middleware/csrf_middleware";
import { enhancedCorsMiddleware, corsDebugMiddleware, corsErrorHandler } from "../middleware/enhanced_cors_middleware";
import { swrCorsMiddleware } from "../middleware/swr_cors_middleware";

const web: Express = express();
if (process.env.NODE_ENV !== "test") {
    Sentry.setupExpressErrorHandler(web);
}

// Tambahkan sebelum route definitions
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: process.env.NODE_ENV !== "production" ? 9999999999 : 100, // batas 100 request per windowMs per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "ERROR",
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests, please try again later"
    }
});
if (process.env.NODE_ENV !== "test") {
    web.use(auditLogMiddleware)
}
web.use(limiter);

const allowedOrigins = process.env.ALLOWED_ORIGINS ?
    process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) :
    process.env.NODE_ENV === 'development' ?
        ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'] :
        []; // In production, require explicit ALLOWED_ORIGINS

// 1. Tambahkan header yang mungkin dikirim SWR
web.use(cors({
    origin: (origin, callback) => {
        // Evaluate allowed origins dynamically to support testing
        const dynamicAllowedOrigins = process.env.ALLOWED_ORIGINS ?
            process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) :
            process.env.NODE_ENV === 'development' ?
                ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'] :
                []; // In production, require explicit ALLOWED_ORIGINS

        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Check if origin is allowed
        if (dynamicAllowedOrigins.includes('*') || dynamicAllowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // For development, be more permissive
        if (process.env.NODE_ENV === 'development' &&
            (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-CSRF-Token',
        'X-API-Key',
        // Tambahkan headers yang sering digunakan SWR
        'Cache-Control',
        'If-None-Match',
        'If-Modified-Since',
        'x-control-user' // Header khusus dari auth middleware
    ],
    exposedHeaders: ['X-CSRF-Token', 'ETag', 'Last-Modified'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200,
    maxAge: 86400 // Cache preflight response selama 24 jam
}));

// ...existing code...

// 2. Perbaiki handling OPTIONS request
web.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        // Set headers required for pre-flight, including sanitized CORS origin validation
        const allowedOrigins = process.env.ALLOWED_ORIGINS ?
            process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) :
            process.env.NODE_ENV === 'development' ?
                ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'] :
                []; // Require explicit ALLOWED_ORIGINS in production
        
        const requestOrigin = req.headers.origin;
        if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
            res.header('Access-Control-Allow-Origin', requestOrigin);
        } else {
            res.header('Access-Control-Allow-Origin', 'null'); // Explicitly reject invalid origins
        }
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
        res.header('Access-Control-Allow-Headers', [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
            'X-CSRF-Token',
            'X-API-Key',
            'Cache-Control',
            'If-None-Match',
            'If-Modified-Since',
            'x-control-user'
        ].join(','));
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400');
        return res.status(200).end();
    }
    next();
});

// ...existing code...

web.use(cors({
    origin: (origin, callback) => {
        // Evaluate allowed origins dynamically to support testing
        const dynamicAllowedOrigins = process.env.ALLOWED_ORIGINS ?
            process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) :
            process.env.NODE_ENV === 'development' ?
                ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'] :
                []; // In production, require explicit ALLOWED_ORIGINS

        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Check if origin is allowed
        if (dynamicAllowedOrigins.includes('*') || dynamicAllowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // For development, be more permissive
        if (process.env.NODE_ENV === 'development' &&
            (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-CSRF-Token',
        'X-API-Key'
    ],
    exposedHeaders: ['X-CSRF-Token'],
    credentials: true, // Enable credentials untuk session/cookies
    preflightContinue: false,
    optionsSuccessStatus: 200
}));

// Add CORS debug logging in development
if (process.env.NODE_ENV === 'development') {
    web.use(corsDebugMiddleware);
}

// Add enhanced CORS middleware for better Next.js compatibility
web.use(enhancedCorsMiddleware);
web.use(swrCorsMiddleware);

// Tambahkan cookie parser middleware
web.use(cookieParser(process.env.COOKIE_SECRET || 'secure-cookie-secret-key'));

// Implementasi session middleware yang dibutuhkan untuk lusca.csrf
web.use(session({
    secret: process.env.SESSION_SECRET || 'secure-session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Gunakan secure cookies di production
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 24 jam
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Important for cross-origin
    },
    name: 'sessionId' // Custom session name
}));

// Handle preflight OPTIONS requests explicitly
web.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        // Preflight request sudah di-handle oleh CORS middleware
        return res.status(200).end();
    }
    next();
});

// Simpan middleware CSRF di variabel untuk digunakan secara kondisional
const csrfProtection = lusca.csrf();

// Middleware untuk menggunakan CSRF protection secara kondisional
web.use((req, res, next) => {
    // Endpoint yang tidak memerlukan CSRF protection
    const csrfExemptPaths = [
        '/api/v1/auth/login',
        '/api/v1/auth/refresh-token',
        '/api/v1/auth/csrf-token'
    ];

    // Lewati CSRF check untuk endpoint yang dikecualikan
    if (csrfExemptPaths.includes(req.path)) {
        return next();
    }

    // Terapkan CSRF protection untuk endpoint lainnya
    return csrfProtection(req, res, next);
});

// Middleware untuk menyediakan CSRF token di semua response header
web.use(csrfTokenMiddleware);


web.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hsts: { maxAge: 15552000, includeSubDomains: true },
    referrerPolicy: { policy: "no-referrer" },
    xssFilter: true,
    noSniff: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" }
}));

web.use((_, res, next) => {
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});

web.use(
    bodyParser.urlencoded({
        extended: false,
    })
);
web.use(bodyParser.json())
web.use('/', router)
web.use(ErrorController.notFoundHandler)
web.use(corsErrorHandler) // Add CORS error handler before general error handler
web.use(errorMiddleware)

const server = http.createServer(web);
server.setTimeout(30000); // 30 detik timeout

export { web, Sentry }
