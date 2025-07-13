import supertest from 'supertest';
import { web } from '../src/application/web';
import { logger } from '../src/application/logger';
import { prismaClient } from '../src/application/database';
import { AuthUserTest } from './test_util';
import { v4 as uuidv4 } from 'uuid';

// Helper class for Domain tests
class DomainTest {
    static async addTestDomain(userId: string): Promise<{ id: string, domain: string }> {
        const id = uuidv4();
        // Add random string to ensure uniqueness even when called in quick succession
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const domain = `test-domain-${Date.now()}-${randomSuffix}.com`;

        await prismaClient.domain.create({
            data: {
                id,
                domain,
                user_id: userId,
                is_default: 0,
                is_deleted: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        return { id, domain };
    }

    static async deleteTestDomains() {
        await prismaClient.domain.deleteMany({
            where: {
                domain: {
                    contains: 'test-domain-'
                }
            }
        });
    }
}

describe('Domain API', () => {
    // Clean up test domains before and after all tests
    beforeAll(async () => {
        await DomainTest.deleteTestDomains();
    });

    afterAll(async () => {
        await DomainTest.deleteTestDomains();
    });

    describe('GET /api/v1/domain/', () => {
        beforeAll(async () => {
            // Get the logged in user
            const user = await AuthUserTest.login('superadmin@mail.com');
            // Create some test domains
            await DomainTest.addTestDomain(user.id);
            await DomainTest.addTestDomain(user.id);
        });

        it('should reject get if header is invalid', async () => {
            const response = await supertest(web)
                .get('/api/v1/domain/')
                .set('authorization', '');

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('ERROR');
            expect(response.body.code).toBe('UNAUTHORIZED');
        });

        it('should successfully get domains with pagination', async () => {
            const { id, token, csrfToken, cookie } = await AuthUserTest.login('superadmin@mail.com');

            const response = await supertest(web)
                .get('/api/v1/domain/')
                .set('authorization', 'Bearer ' + token)
                .set('x-control-user', id)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .query({
                    page: '1',
                    limit: '10',
                    sort: 'asc',
                });

            logger.debug(response.body);
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('OK');
            expect(response.body.code).toBe('SUCCESS');
            expect(response.body.data).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('paging');
            expect(response.body.data.data.length).toBeGreaterThanOrEqual(2);
        });

        it('should successfully search domains by keyword', async () => {
            const { id, token, csrfToken, cookie } = await AuthUserTest.login('superadmin@mail.com');

            const response = await supertest(web)
                .get('/api/v1/domain/')
                .set('authorization', 'Bearer ' + token)
                .set('x-control-user', id)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .query({
                    page: '1',
                    limit: '10',
                    sort: 'asc',
                    keyword: 'test-domain-'
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('OK');
            expect(response.body.data.data.length).toBeGreaterThanOrEqual(2);
            expect(response.body.data.data[0].domain).toContain('test-domain-');
        });
    });

    describe('POST /api/v1/domain/', () => {
        it('should reject store if header is invalid', async () => {
            const { csrfToken, cookie } = await AuthUserTest.login('superadmin@mail.com');
            const response = await supertest(web)
                .post('/api/v1/domain/')
                .set('authorization', '')
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .send({
                    domain: 'https://example.com',
                });

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('ERROR');
            expect(response.body.code).toBe('UNAUTHORIZED');
        });

        it('should reject store if domain is invalid', async () => {
            const { id, token, csrfToken, cookie } = await AuthUserTest.login('superadmin@mail.com');

            const response = await supertest(web)
                .post('/api/v1/domain/')
                .set('authorization', 'Bearer ' + token)
                .set('x-control-user', id)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .send({
                    domain: 'invalid-domain',
                });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('ERROR');
            expect(response.body.code).toBe('ERROR_VALIDATION');
        });

        it('should successfully store a domain', async () => {
            const { id, token, csrfToken, cookie } = await AuthUserTest.login('superadmin@mail.com');

            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const domainName = `https://test-domain-${Date.now()}-${randomSuffix}.com`;
            const response = await supertest(web)
                .post('/api/v1/domain/')
                .set('authorization', 'Bearer ' + token)
                .set('x-control-user', id)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .send({
                    domain: domainName,
                    is_default: 0
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('OK');
            expect(response.body.code).toBe('SUCCESS_ADD_DOMAIN');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('domain');
            expect(response.body.data.domain).toBe(domainName);
        });

        it('should reject duplicate domain', async () => {
            const { id, token, csrfToken, cookie } = await AuthUserTest.login('superadmin@mail.com');

            // First, add a domain
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const domainName = `https://test-domain-duplicate-${Date.now()}-${randomSuffix}.com`;
            await supertest(web)
                .post('/api/v1/domain/')
                .set('authorization', 'Bearer ' + token)
                .set('x-control-user', id)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .send({
                    domain: domainName,
                    is_default: 0
                });

            // Try to add the same domain again
            const response = await supertest(web)
                .post('/api/v1/domain/')
                .set('authorization', 'Bearer ' + token)
                .set('x-control-user', id)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .send({
                    domain: domainName,
                    is_default: 0
                });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('ERROR');
            expect(response.body.code).toBe('DATA_ALREADY_EXIST');
        });

        it('should set a domain as default', async () => {
            const { id, token, csrfToken, cookie } = await AuthUserTest.login('superadmin@mail.com');

            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const domainName = `https://test-default-domain-${Date.now()}-${randomSuffix}.com`;
            const response = await supertest(web)
                .post('/api/v1/domain/')
                .set('authorization', 'Bearer ' + token)
                .set('x-control-user', id)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .send({
                    domain: domainName,
                    is_default: 1
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('OK');
            expect(response.body.code).toBe('SUCCESS_ADD_DOMAIN');
            expect(response.body.data.is_default).toBe(1);

            // Verify this is the only default domain
            const getResponse = await supertest(web)
                .get('/api/v1/domain/')
                .set('authorization', 'Bearer ' + token)
                .set('x-control-user', id)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .query({
                    page: '1',
                    limit: '100',
                });

            const defaultDomains = getResponse.body.data.data.filter((d: any) => d.is_default === 1);
            expect(defaultDomains.length).toBe(1);
            expect(defaultDomains[0].domain).toBe(domainName);
        });
    });

    describe('PUT /api/v1/domain/:id', () => {
        it('should reject update if header is invalid', async () => {
            const { csrfToken, cookie } = await AuthUserTest.login('superadmin@mail.com');
            const response = await supertest(web)
                .put('/api/v1/domain/some-id')
                .set('authorization', '')
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .send({
                    domain: 'https://example.com',
                });

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('ERROR');
            expect(response.body.code).toBe('UNAUTHORIZED');
        });

        it('should reject update if domain ID does not exist', async () => {
            const { id, token, csrfToken, cookie } = await AuthUserTest.login('superadmin@mail.com');

            const response = await supertest(web)
                .put('/api/v1/domain/non-existent-id')
                .set('authorization', 'Bearer ' + token)
                .set('x-control-user', id)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .send({
                    domain: 'https://updated-example.com',
                });

            expect(response.status).toBe(404);
            expect(response.body.status).toBe('ERROR');
            expect(response.body.code).toBe('DATA_NOT_EXIST');
        });

        it('should successfully update a domain', async () => {
            const { id: userId, token, csrfToken, cookie } = await AuthUserTest.login('superadmin@mail.com');

            // First, create a domain
            const { id: domainId } = await DomainTest.addTestDomain(userId);

            // Update the domain
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const newDomainName = `https://updated-test-domain-${Date.now()}-${randomSuffix}.com`;
            const response = await supertest(web)
                .put(`/api/v1/domain/${domainId}`)
                .set('authorization', 'Bearer ' + token)
                .set('x-control-user', userId)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .send({
                    domain: newDomainName,
                    is_default: 1
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('OK');
            expect(response.body.code).toBe('SUCCESS_UPDATE_DOMAIN');
            expect(response.body.data.domain).toBe(newDomainName);
            expect(response.body.data.is_default).toBe(1);
        });
    });

    describe('DELETE /api/v1/domain/:id', () => {
        it('should reject delete if header is invalid', async () => {
            const { csrfToken, cookie } = await AuthUserTest.login('superadmin@mail.com');
            const response = await supertest(web)
                .delete('/api/v1/domain/some-id')
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .set('authorization', '');

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('ERROR');
            expect(response.body.code).toBe('UNAUTHORIZED');
        });

        it('should reject delete if domain ID does not exist', async () => {
            const { id, token, csrfToken, cookie } = await AuthUserTest.login('superadmin@mail.com');

            const response = await supertest(web)
                .delete('/api/v1/domain/non-existent-id')
                .set('authorization', 'Bearer ' + token)
                .set('x-control-user', id)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie);

            expect(response.status).toBe(404);
            expect(response.body.status).toBe('ERROR');
            expect(response.body.code).toBe('DATA_NOT_EXIST');
        });

        it('should successfully delete a domain', async () => {
            const { id: userId, token, csrfToken, cookie } = await AuthUserTest.login('superadmin@mail.com');

            // First, create a domain
            const { id: domainId } = await DomainTest.addTestDomain(userId);

            // Delete the domain
            const response = await supertest(web)
                .delete(`/api/v1/domain/${domainId}`)
                .set('authorization', 'Bearer ' + token)
                .set('x-control-user', userId)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('OK');
            expect(response.body.code).toBe('SUCCESS_DELETE_DOMAIN');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.id).toBe(domainId);

            // Verify it doesn't appear in the list anymore (or is marked as deleted)
            const getResponse = await supertest(web)
                .get('/api/v1/domain/')
                .set('authorization', 'Bearer ' + token)
                .set('x-control-user', userId)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .query({
                    page: '1',
                    limit: '100',
                });

            const deletedDomain = getResponse.body.data.data.find((d: any) => d.id === domainId);
            expect(deletedDomain).toBeUndefined();
        });
    });

    describe('POST /api/v1/domain/set-default', () => {
        it('should reject setting default if header is invalid', async () => {
            const { csrfToken, cookie } = await AuthUserTest.login('superadmin@mail.com');
            const response = await supertest(web)
                .post('/api/v1/domain/set-default')
                .set('authorization', '')
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .send({
                    domain_id: 'some-id'
                });

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('ERROR');
            expect(response.body.code).toBe('UNAUTHORIZED');
        });

        it('should reject setting default if domain ID does not exist', async () => {
            const { id, token, csrfToken, cookie } = await AuthUserTest.login('superadmin@mail.com');

            const response = await supertest(web)
                .post('/api/v1/domain/set-default')
                .set('authorization', 'Bearer ' + token)
                .set('x-control-user', id)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .send({
                    domain_id: 'non-existent-id'
                });

            expect(response.status).toBe(404);
            expect(response.body.status).toBe('ERROR');
            expect(response.body.code).toBe('DATA_NOT_EXIST');
        });

        it('should successfully set a domain as default', async () => {
            const { id: userId, token, csrfToken, cookie } = await AuthUserTest.login('superadmin@mail.com');

            // Create two domains
            const { id: domainId1 } = await DomainTest.addTestDomain(userId);
            const { id: domainId2 } = await DomainTest.addTestDomain(userId);

            // Set the first domain as default
            let response = await supertest(web)
                .post('/api/v1/domain/set-default')
                .set('authorization', 'Bearer ' + token)
                .set('x-control-user', userId)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .send({
                    domain_id: domainId1
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('OK');
            expect(response.body.code).toBe('SUCCESS_SET_DEFAULT_DOMAIN');
            expect(response.body.data.id).toBe(domainId1);
            expect(response.body.data.is_default).toBe(1);

            // Set the second domain as default
            response = await supertest(web)
                .post('/api/v1/domain/set-default')
                .set('authorization', 'Bearer ' + token)
                .set('x-control-user', userId)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .send({
                    domain_id: domainId2
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('OK');
            expect(response.body.code).toBe('SUCCESS_SET_DEFAULT_DOMAIN');
            expect(response.body.data.id).toBe(domainId2);
            expect(response.body.data.is_default).toBe(1);

            // Verify only the second domain is default now
            const getResponse = await supertest(web)
                .get('/api/v1/domain/')
                .set('authorization', 'Bearer ' + token)
                .set('x-control-user', userId)
                .set('X-CSRF-Token', csrfToken)
                .set('Cookie', cookie)
                .query({
                    page: '1',
                    limit: '100',
                });

            const defaultDomains = getResponse.body.data.data.filter((d: any) => d.is_default === 1);
            expect(defaultDomains.length).toBe(1);
            expect(defaultDomains[0].id).toBe(domainId2);

            const domain1 = getResponse.body.data.data.find((d: any) => d.id === domainId1);
            expect(domain1.is_default).toBe(0);
        });
    });
});
