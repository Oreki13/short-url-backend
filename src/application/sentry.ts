import * as Sentry from "@sentry/node"
import * as os from "node:os";

const { nodeProfilingIntegration } = require("@sentry/profiling-node");
Sentry.init({
    dsn: process.env.SENTRY_DSN,

    integrations: [
        nodeProfilingIntegration(),
        Sentry.anrIntegration({ captureStackTrace: true })
    ],
    tracesSampleRate: 1.0,
    serverName: os.hostname(),
    profilesSampleRate: 1.0,
    environment: process.env.NODE_ENV ?? "development",
    enabled: process.env.NODE_ENV !== "test"
});