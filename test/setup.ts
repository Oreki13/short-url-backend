import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { prismaClient } from '../src/application/database';
import supertest from 'supertest';
import { web } from '../src/application/web';
import jwt from 'jsonwebtoken';
import { logger } from '../src/application/logger';

// Initialize testSession global - no need to redeclare the type here
global.testSession = {
    cookies: undefined,
    sharedToken: undefined,
    sharedUserId: undefined,
    sharedCsrfToken: undefined
};

// Load environment variables from .env.test if it exists
dotenv.config({
    path: path.resolve(__dirname, '../.env.test')
});

// Make sure we're using test environment
process.env.NODE_ENV = 'test';

// Ensure ALLOWED_ORIGINS is set for testing
if (!process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000';
}

// Ensure SECRET_KEY is set for JWT
if (!process.env.SECRET_KEY) {
    process.env.SECRET_KEY = 'test-secret-key';
}

// Create a shared test login for all tests
beforeAll(async () => {
    try {
        // Login once to get shared credentials
        const login = await supertest(web)
            .post("/api/v1/auth/login")
            .send({
                email: "superadmin@mail.com",
                password: "123"
            });

        if (login.status !== 200 || !login.body.data?.access_token) {
            throw new Error(`Failed to login: ${JSON.stringify(login.body)}`);
        }

        // Store the shared token and cookies
        global.testSession.sharedToken = login.body.data.access_token;

        // Decode token to get user ID
        const decode: any = jwt.decode(login.body.data.access_token);
        global.testSession.sharedUserId = decode.id;

        // Store cookies
        if (login.headers['set-cookie'] && Array.isArray(login.headers['set-cookie'])) {
            global.testSession.cookies = login.headers['set-cookie'].join('; ');
        }

        // Get a shared CSRF token
        const csrfReq = supertest(web)
            .get("/csrf-token")
            .set('Authorization', `Bearer ${global.testSession.sharedToken}`)
            .set('x-control-user', global.testSession.sharedUserId || '')
            .set('Cookie', global.testSession.cookies || '');

        const csrfResponse = await csrfReq;

        // Update cookies from CSRF response
        if (csrfResponse.headers['set-cookie'] && Array.isArray(csrfResponse.headers['set-cookie'])) {
            global.testSession.cookies = csrfResponse.headers['set-cookie'].join('; ');
        }

        // Get token from both header and body 
        const headerToken = csrfResponse.headers['x-csrf-token'];
        const bodyToken = csrfResponse.body.data?.csrfToken;
        global.testSession.sharedCsrfToken = bodyToken || headerToken || '';

        logger.info(`Test setup complete. Shared session created with token: ${global.testSession.sharedToken?.substring(0, 10)}...`);
        logger.info(`CSRF token: ${global.testSession.sharedCsrfToken}`);
    } catch (error) {
        console.error('Error setting up test shared session:', error);
        throw error;
    }
});

// Close Prisma connection after all tests
afterAll(async () => {
    await prismaClient.$disconnect();
});

// Configure test timeout
jest.setTimeout(30000);