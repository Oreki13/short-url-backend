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

const web: Express = express();
if (process.env.NODE_ENV !== "test") {
    Sentry.setupExpressErrorHandler(web);
}

// Tambahkan sebelum route definitions
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 100, // batas 100 request per windowMs per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "ERROR",
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests, please try again later"
    }
});
web.use(limiter);

const allowedOrigins = process.env.ALLOWED_ORIGINS ?
    process.env.ALLOWED_ORIGINS.split(',') :
    ['http://localhost:3000'];

web.use(cors(
    {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true, // Penting untuk cookie cross-origin
    }
));

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
        maxAge: 1000 * 60 * 60 * 24 // 24 jam
    }
}));

if (process.env.NODE_ENV !== "development") {
    // Simpan middleware CSRF di variabel untuk digunakan secara kondisional
    const csrfProtection = lusca.csrf();

    // Middleware untuk menggunakan CSRF protection secara kondisional
    web.use((req, res, next) => {
        // Endpoint yang tidak memerlukan CSRF protection
        const csrfExemptPaths = [
            '/api/v1/auth/login',
            '/api/v1/auth/refresh-token'
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
}


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
if (process.env.NODE_ENV !== "test") {
    web.use(auditLogMiddleware)
}
web.use('/', router)
web.use(ErrorController.notFoundHandler)
web.use(errorMiddleware)

const server = http.createServer(web);
server.setTimeout(30000); // 30 detik timeout

export { web, Sentry }
