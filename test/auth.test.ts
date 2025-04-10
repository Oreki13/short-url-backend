import request from 'supertest';
import { web } from '../src/application/web';
import { prismaClient } from '../src/application/database';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@sentry/node';


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

    describe('POST /auth/login', () => {
        it('should return 200 and tokens when login is successful', async () => {
            const response = await request(web)
                .post('/auth/login')
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
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(404);
            expect(response.body.code).toBe('INVALID_CREDENTIAL');
        });

        it('should return 400 when email is invalid format', async () => {
            const response = await request(web)
                .post('/auth/login')
                .send({
                    email: 'invalid-email',
                    password: testUser.password
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /auth/verify', () => {
        it('should return 200 when token is valid', async () => {
            const response = await request(web)
                .get('/auth/verify')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('x-control-user', testUser.id);

            expect(response.status).toBe(200);
        });

        it('should return 401 when token is invalid', async () => {
            const response = await request(web)
                .get('/auth/verify')
                .set('Authorization', 'Bearer invalidtoken')
                .set('x-control-user', testUser.id);

            expect(response.status).toBe(401);
            expect(response.body.code).toBe('INVALID_TOKEN');
        });

        it('should return 401 when user id does not match', async () => {
            const response = await request(web)
                .get('/auth/verify')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('x-control-user', 'invalid-user-id');

            expect(response.status).toBe(401);
            expect(response.body.code).toBe('INVALID_USER_TOKEN');
        });
    });

    describe('POST /auth/refresh-token', () => {
        it('should return new access token when refresh token is valid', async () => {
            const response = await request(web)
                .post('/auth/refresh-token')
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
                .post('/auth/refresh-token')
                .send({
                    refresh_token: 'invalid-refresh-token'
                });

            expect(response.status).toBe(401);
            expect(response.body.code).toBe('INVALID_REFRESH_TOKEN');
        });
    });

    describe('POST /auth/revoke-token', () => {
        it('should return 200 when token is revoked successfully', async () => {
            // First get a new refresh token via login
            const loginResponse = await request(web)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            const tokenToRevoke = loginResponse.body.data.refresh_token;

            const response = await request(web)
                .post('/auth/revoke-token')
                .send({
                    refresh_token: tokenToRevoke
                });

            expect(response.status).toBe(200);
            expect(response.body.code).toBe('TOKEN_REVOKED');
        });

        it('should return 404 when token is not found', async () => {
            const response = await request(web)
                .post('/auth/revoke-token')
                .send({
                    refresh_token: 'non-existent-token'
                });

            expect(response.status).toBe(404);
            expect(response.body.code).toBe('TOKEN_NOT_FOUND');
        });
    });

    describe('POST /auth/logout', () => {
        it('should return 200 when logout is successful', async () => {
            const response = await request(web)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.code).toBe('LOGOUT_SUCCESS');
        });

        it('should return 401 when no authorization header is provided', async () => {
            const response = await request(web)
                .post('/auth/logout');

            expect(response.status).toBe(401);
            expect(response.body.code).toBe('UNAUTHORIZED');
        });

        it('should return 500 when token is invalid', async () => {
            const response = await request(web)
                .post('/auth/logout')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(500);
        });
    });

    describe('Token Limit', () => {
        it('should limit the number of active tokens per user', async () => {
            // Login 6 times to exceed the limit of 5 tokens
            for (let i = 0; i < 6; i++) {
                await request(web)
                    .post('/auth/login')
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