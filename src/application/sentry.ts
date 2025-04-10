import * as SentryCore from "@sentry/node";
import * as os from "node:os";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { anrIntegration } from "@sentry/node";

export class SentryService {
    private static instance: SentryService;

    // Expose core Sentry API methods with proper typing
    public readonly captureException: typeof SentryCore.captureException;
    public readonly captureMessage: typeof SentryCore.captureMessage;
    public readonly startSpan: typeof SentryCore.startSpan;
    public readonly setContext: typeof SentryCore.setContext;
    public readonly setUser: typeof SentryCore.setUser;
    public readonly setTag: typeof SentryCore.setTag;
    public readonly setTags: typeof SentryCore.setTags;
    public readonly setExtras: typeof SentryCore.setExtras;

    private constructor() {
        // Bypass initialization if DISABLE_SENTRY is true
        if (process.env.DISABLE_SENTRY === 'true') {
            // Create dummy implementations
            this.captureException = () => '';
            this.captureMessage = () => '';
            this.startSpan = (() => ({ end: () => { } })) as typeof SentryCore.startSpan;
            this.setContext = () => { };
            this.setUser = () => { };
            this.setTag = () => { };
            this.setTags = () => { };
            this.setExtras = () => { };
            return;
        }

        // Initialize Sentry
        const integrations = [];

        // Only add profiling if not disabled and running on supported Node version
        if (process.env.DISABLE_PROFILING !== 'true') {
            try {
                integrations.push(nodeProfilingIntegration());
                integrations.push(anrIntegration({ captureStackTrace: true }));
            } catch (e) {
                console.warn('Sentry profiling integration could not be initialized:', e);
            }
        }

        SentryCore.init({
            dsn: process.env.SENTRY_DSN,
            integrations,
            tracesSampleRate: 1.0,
            serverName: os.hostname(),
            profilesSampleRate: 1.0,
            environment: process.env.NODE_ENV ?? "development",
            enabled: process.env.NODE_ENV !== "test" && process.env.DISABLE_SENTRY !== 'true'
        });

        // Bind methods to maintain 'this' context and provide proper typing
        this.captureException = SentryCore.captureException;
        this.captureMessage = SentryCore.captureMessage;
        this.startSpan = SentryCore.startSpan;
        this.setContext = SentryCore.setContext;
        this.setUser = SentryCore.setUser;
        this.setTag = SentryCore.setTag;
        this.setTags = SentryCore.setTags;
        this.setExtras = SentryCore.setExtras;
    }

    // Singleton pattern to ensure only one instance exists
    public static getInstance(): SentryService {
        if (!SentryService.instance) {
            SentryService.instance = new SentryService();
        }

        return SentryService.instance;
    }

    // Utility method for Express.js setup
    public setupExpressErrorHandler(app: any): void {
        if (process.env.DISABLE_SENTRY === 'true') return;
        SentryCore.setupExpressErrorHandler(app);
    }
}

// Export a singleton instance
export const Sentry = SentryService.getInstance();

// Also export the core for any advanced usage
export { SentryCore };