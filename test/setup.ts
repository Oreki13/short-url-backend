import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { prismaClient } from '../src/application/database';

// Load environment variables from .env.test if it exists
dotenv.config({
    path: path.resolve(__dirname, '../.env.test')
});

// Make sure we're using test environment
process.env.NODE_ENV = 'test';

// Ensure SECRET_KEY is set for JWT
if (!process.env.SECRET_KEY) {
    process.env.SECRET_KEY = 'test-secret-key';
}

// // Global setup before running tests
// beforeAll(async () => {
//     // Reset database before running tests
//     if (process.env.NODE_ENV === 'test') {
//         try {
//             // Push schema to test database
//             execSync('npm run db:test:reset', {
//                 env: {
//                     ...process.env,
//                     DATABASE_URL: process.env.DATABASE_URL
//                 }
//             });
//             execSync('npm run db:test:seed', {
//                 env: {
//                     ...process.env,
//                     DATABASE_URL: process.env.DATABASE_URL
//                 }
//             });

//             console.log('Test database reset successfully');
//         } catch (error) {
//             console.error('Error setting up test database:', error);
//             throw error;
//         }
//     }
// });

// // Close Prisma connection after all tests
// afterAll(async () => {
//     await prismaClient.$disconnect();
// });

// Configure test timeout
jest.setTimeout(30000);