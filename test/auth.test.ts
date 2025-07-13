import request from 'supertest';
import { web } from '../src/application/web';
import { prismaClient } from '../src/application/database';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../src/application/logger';


// Mock data
const testUser = {
    id: uuidv4(),
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role_id: uuidv4(),
    is_deleted: 0
};

const testRole = {
    id: testUser.role_id,
    name: 'user-test'
};

let refreshToken: string;
let accessToken: string;
let csrfToken: string;

// Helper function to get CSRF token
async function getCsrfToken(authToken?: string, userId?: string) {
    // Persiapkan request untuk mendapatkan CSRF token
    const req = request(web).get("/api/v1/auth/csrf-token");

    // Tambahkan credentials jika diberikan
    if (authToken && userId) {
        req.set('Authorization', `Bearer ${authToken}`);
        req.set('x-control-user', userId);
    }

    // Tambahkan session cookies jika tersedia
    if (global.testSession?.cookies) {
        req.set('Cookie', global.testSession.cookies);
    }

    // Kirim request
    const csrfResponse = await req;

    // Simpan cookies dari response
    const setCookieHeader = csrfResponse.headers['set-cookie'];
    if (setCookieHeader && Array.isArray(setCookieHeader)) {
        global.testSession = global.testSession || {};
        global.testSession.cookies = setCookieHeader.join('; ');
    }

    // Dapatkan token dari header dan body response
    const headerToken = csrfResponse.headers['x-csrf-token'];
    const bodyToken = csrfResponse.body.data?.csrfToken;
    const csrfToken = bodyToken || headerToken || '';

    logger.info(`CSRF Token generated: ${csrfToken}`);
    return csrfToken;
}

describe('Auth API', () => {

    // Setup test database before running tests
    beforeAll(async () => {
        logger.info('Setting up test database...');
        // Create test role
        await prismaClient.roleUser.create({
            data: testRole
        });

        // Create test user with hashed password
        const hashedPassword = await bcrypt.hash(testUser.password, 10);
        await prismaClient.user.create({
            data: {
                id: testUser.id,
                name: testUser.name,
                email: testUser.email,
                password: hashedPassword,
                role_id: testUser.role_id,
                is_deleted: testUser.is_deleted
            }
        });
    });

    // Clean up after tests
    afterAll(async () => {
        // Delete all tokens for the test user
        await prismaClient.token.deleteMany({
            where: { user_id: testUser.id }
        });

        // Delete all user activities for the test user
        await prismaClient.userActivity.deleteMany({
            where: { user_id: testUser.id }
        });

        // Delete all data URLs for the test user
        await prismaClient.dataUrl.deleteMany({
            where: { user_id: testUser.id }
        });

        // Delete all domains for the test user
        await prismaClient.domain.deleteMany({
            where: { user_id: testUser.id }
        });

        // Delete test user
        await prismaClient.user.delete({
            where: { id: testUser.id }
        });

        // Delete test role
        await prismaClient.roleUser.delete({
            where: { id: testUser.role_id }
        });

        // Close Prisma client
        await prismaClient.$disconnect();
    });

    describe('POST /api/v1/auth/login', () => {
        it('should return 200 and tokens when login is successful', async () => {
            const response = await request(web)
                .post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(response.status).toBe(200);
            expect(response.body.code).toBe('LOGIN_SUCCESS');
            expect(response.body.data).toHaveProperty('access_token');
            expect(response.body.data).toHaveProperty('refresh_token');
            expect(response.body.data).toHaveProperty('expires_in');

            // Save tokens for subsequent tests
            accessToken = response.body.data.access_token;
            refreshToken = response.body.data.refresh_token;
        });

        it('should return 404 when credentials are invalid', async () => {
            const response = await request(web)
                .post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(404);
            expect(response.body.code).toBe('INVALID_CREDENTIAL');
        });

        it('should return 400 when email is invalid format', async () => {
            const response = await request(web)
                .post('/api/v1/auth/login')
                .send({
                    email: 'invalid-email',
                    password: testUser.password
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/v1/auth/verify', () => {
        it('should return 200 when token is valid', async () => {
            const response = await request(web)
                .get('/api/v1/auth/verify')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('x-control-user', testUser.id);

            expect(response.status).toBe(200);
        });

        it('should return 401 when token is invalid', async () => {
            const response = await request(web)
                .get('/api/v1/auth/verify')
                .set('Authorization', 'Bearer invalidtoken')
                .set('x-control-user', testUser.id);

            expect(response.status).toBe(401);
            expect(response.body.code).toBe('INVALID_TOKEN');
        });

        it('should return 401 when user id does not match', async () => {
            const response = await request(web)
                .get('/api/v1/auth/verify')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('x-control-user', 'invalid-user-id');

            expect(response.status).toBe(401);
            expect(response.body.code).toBe('INVALID_USER_TOKEN');
        });
    });

    describe('POST /api/v1/auth/refresh-token', () => {
        it('should return new access token when refresh token is valid', async () => {
            const response = await request(web)
                .post('/api/v1/auth/refresh-token')
                .send({
                    refresh_token: refreshToken
                });

            expect(response.status).toBe(200);
            expect(response.body.code).toBe('TOKEN_REFRESHED');
            expect(response.body.data).toHaveProperty('access_token');
            expect(response.body.data).toHaveProperty('expires_in');

            // Update access token for subsequent tests
            accessToken = response.body.data.access_token;
        });

        it('should return 401 when refresh token is invalid', async () => {
            const response = await request(web)
                .post('/api/v1/auth/refresh-token')
                .send({
                    refresh_token: 'invalid-refresh-token'
                });

            expect(response.status).toBe(401);
            expect(response.body.code).toBe('INVALID_REFRESH_TOKEN');
        });
    });

    describe('POST /api/v1/auth/revoke-token', () => {
        it('should return 200 when token is revoked successfully', async () => {
            // First get a new refresh token via login
            const loginResponse = await request(web)
                .post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            logger.info(`Login response: ${JSON.stringify(loginResponse.body)}`);
            let tokenToRevoke: string
            let newAccessToken: string
            // Check if login response contains expected data
            if (!loginResponse.body.data || !loginResponse.body.data.refresh_token) {
                logger.error('Login response does not contain refresh_token');
                // Use existing refresh token from previous tests if available
                tokenToRevoke = refreshToken;
                newAccessToken = accessToken;
            } else {
                tokenToRevoke = loginResponse.body.data.refresh_token;
                newAccessToken = loginResponse.body.data.access_token;
            }

            // Ensure we have a token to work with
            expect(tokenToRevoke).toBeDefined();
            expect(newAccessToken).toBeDefined();

            // Decode user ID from token
            const decoded: any = require('jsonwebtoken').decode(newAccessToken);
            const userId = decoded.id;

            // Extract all cookies from login response
            const cookieHeader = loginResponse.headers['set-cookie'];
            let cookieString = '';

            if (cookieHeader && Array.isArray(cookieHeader)) {
                cookieString = cookieHeader.join('; ');
                logger.info(`Cookies from login: ${cookieString}`);
            }

            // Get CSRF token from the dedicated endpoint, preserving the same session
            const csrfResponse = await request(web)
                .get('/api/v1/auth/csrf-token')
                .set('Authorization', `Bearer ${newAccessToken}`)
                .set('x-control-user', userId)
                .set('Cookie', cookieString);

            // Extract CSRF token from both header and body
            const headerCsrfToken = csrfResponse.headers['x-csrf-token'];
            const bodyCsrfToken = csrfResponse.body.data?.csrfToken;
            const csrfToken = bodyCsrfToken || headerCsrfToken;

            logger.info(`CSRF Token received: ${csrfToken}`);

            // Extract session cookies from CSRF response as well
            const csrfCookieHeader = csrfResponse.headers['set-cookie'];
            if (csrfCookieHeader && Array.isArray(csrfCookieHeader)) {
                cookieString = csrfCookieHeader.join('; ');
                logger.info(`Cookies from CSRF request: ${cookieString}`);
            }

            // Make the actual revoke-token request with all headers properly set
            const response = await request(web)
                .post('/api/v1/auth/revoke-token')
                .set('Authorization', `Bearer ${newAccessToken}`)
                .set('x-control-user', userId)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookieString)
                .send({
                    refresh_token: tokenToRevoke
                });

            logger.info(`Revoke response: ${JSON.stringify(response.body)}`);
            expect(response.status).toBe(200);
            expect(response.body.code).toBe('TOKEN_REVOKED');
        });

        it('should return 404 when token is not found', async () => {
            // Get CSRF token dengan pendekatan yang sama seperti test yang berhasil
            csrfToken = await getCsrfToken(accessToken, testUser.id);

            // Pastikan menggunakan cookies yang tersimpan di session
            const cookieString = global.testSession?.cookies || '';

            const response = await request(web)
                .post('/api/v1/auth/revoke-token')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('x-control-user', testUser.id)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookieString)
                .send({
                    refresh_token: 'non-existent-token'
                });

            expect(response.status).toBe(404);
            expect(response.body.code).toBe('TOKEN_NOT_FOUND');
        });
    });

    describe('POST /api/v1/auth/logout', () => {
        it('should return 200 when logout is successful', async () => {
            // Get CSRF token first dengan pendekatan yang sama
            csrfToken = await getCsrfToken(accessToken, testUser.id);

            // Pastikan menggunakan cookies yang tersimpan di session
            const cookieString = global.testSession?.cookies || '';

            const response = await request(web)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('x-control-user', testUser.id)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookieString);

            expect(response.status).toBe(200);
            expect(response.body.code).toBe('LOGOUT_SUCCESS');
        });

        it('should return 401 when no authorization header is provided', async () => {
            // Get CSRF token for valid request structure
            csrfToken = await getCsrfToken();
            const cookieString = global.testSession?.cookies || '';

            const response = await request(web)
                .post('/api/v1/auth/logout')
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookieString);

            logger.info(`Unauthorized logout response: ${JSON.stringify(response.body)}`);

            // Sesuaikan dengan status code yang sebenarnya diberikan oleh API
            expect(response.status).toBe(401);
            expect(response.body.code).toBe('UNAUTHORIZED');
        });

        it('should return 401 when token is invalid', async () => {
            // Get a CSRF token anyway for the request
            csrfToken = await getCsrfToken();

            const response = await request(web)
                .post('/api/v1/auth/logout')
                .set('Authorization', 'Bearer invalid-token')
                .set('X-CSRF-Token', csrfToken);

            expect(response.status).toBe(401);
            expect(response.body.code).toBe('UNAUTHORIZED');
        });
    });

    describe('Token Limit', () => {
        it('should limit the number of active tokens per user', async () => {
            // Login 6 times to exceed the limit of 5 tokens
            for (let i = 0; i < 6; i++) {
                await request(web)
                    .post('/api/v1/auth/login')
                    .send({
                        email: testUser.email,
                        password: testUser.password
                    });
            }

            // Check that only 5 active tokens exist for the user
            const activeTokens = await prismaClient.token.findMany({
                where: {
                    user_id: testUser.id,
                    is_revoked: false,
                    expires_at: {
                        gt: new Date()
                    }
                }
            });

            expect(activeTokens.length).toBeLessThanOrEqual(5);
        });
    });
});