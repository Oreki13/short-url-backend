import { prismaClient } from "../src/application/database";
import { DataUrl, User } from "@prisma/client";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import supertest from "supertest";
import { web } from "../src/application/web";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { logger } from "../src/application/logger";

function timeout(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

export class ShortLinkTest {
    static async addMultipleData() {
        const data: Array<DataUrl> = []
        const findUserId = await prismaClient.user.findUnique({
            where: {
                email: "superadmin@mail.com"
            },
            select: {
                id: true,
            }
        })

        for (let i = 0; i < 10; i++) {
            data.push({
                id: uuidv4(),
                user_id: findUserId!.id,
                path: "test_unit_test_path_" + i.toString(),
                destination: "https://google.com",
                count_clicks: 0,
                title: "test_unit_test " + i.toString(),
                is_deleted: 0,
                createdAt: dayjs().toDate(),
                updatedAt: dayjs().toDate()
            })
            await timeout(50);
        }

        await prismaClient.dataUrl.createMany({
            data
        })
    }

    static async deleteMultiple() {
        await prismaClient.dataUrl.deleteMany({
            where: {
                title: {
                    contains: "test_unit_test"
                },
                AND: {
                    user: {
                        email: "superadmin@mail.com"
                    }
                }
            }
        })
    }

    static async deleteAddedShortLink() {
        const checkIfAvail = await prismaClient.dataUrl.findFirst({
            where: {
                title: "test_unit_test",
                user: {
                    email: "superadmin@mail.com"
                }
            }
        })

        if (checkIfAvail !== null) {
            await prismaClient.dataUrl.delete({
                where: {
                    id: checkIfAvail.id
                }
            })
        }
    }
}

export class AuthUserTest {
    static async login(email: string): Promise<{ id: string, token: string, csrfToken: string }> {
        // Use shared session when email is superadmin@mail.com instead of making a new login request
        if (email === "superadmin@mail.com" && global.testSession.sharedToken && global.testSession.sharedUserId && global.testSession.sharedCsrfToken) {
            logger.info(`Using shared login session for ${email}`);
            return {
                id: global.testSession.sharedUserId,
                token: global.testSession.sharedToken,
                csrfToken: global.testSession.sharedCsrfToken
            };
        }

        // For other users, use the regular login flow
        logger.info(`Creating new login session for ${email}`);

        // Perform login
        const login = await supertest(web)
            .post("/api/v1/auth/login")
            .send({
                email: email,
                password: "123"
            });

        if (login.status !== 200) {
            logger.error(`Login failed with status ${login.status}: ${JSON.stringify(login.body)}`);
            throw new Error(`Login failed with status ${login.status}: ${JSON.stringify(login.body)}`);
        }

        // Store cookies from login response
        const loginCookies = login.headers['set-cookie'];
        if (loginCookies && Array.isArray(loginCookies)) {
            global.testSession = global.testSession || {};
            global.testSession.cookies = loginCookies.join('; ');
        } else {
            logger.info('No cookies in login response');
        }

        // Get access token and user ID
        const accessToken = login.body.data?.access_token;
        if (!accessToken) {
            logger.error(`Login response does not contain access_token: ${JSON.stringify(login.body)}`);
            throw new Error("Login failed: No access token returned");
        }

        const decode: any = jwt.decode(accessToken);
        if (!decode || !decode.id) {
            throw new Error("Failed to decode access token");
        }

        // Get CSRF token with the user's credentials
        const csrfReq = supertest(web)
            .get("/csrf-token")
            .set("Authorization", `Bearer ${accessToken}`)
            .set("x-control-user", decode.id);

        // Include cookies from login
        if (global.testSession?.cookies) {
            csrfReq.set("Cookie", global.testSession.cookies);
        }

        const csrfResponse = await csrfReq;

        // Update cookies from CSRF response
        const csrfCookies = csrfResponse.headers['set-cookie'];
        if (csrfCookies && Array.isArray(csrfCookies)) {
            global.testSession = global.testSession || {};
            global.testSession.cookies = csrfCookies.join('; ');
        }

        // Get CSRF token from response
        const headerToken = csrfResponse.headers['x-csrf-token'];
        const bodyToken = csrfResponse.body.data?.csrfToken;
        const csrfToken = bodyToken || headerToken || '';

        if (!csrfToken) {
            logger.error(`Failed to get CSRF token: ${JSON.stringify(csrfResponse.body)}`);
        } else {
            logger.info(`Login successful for ${email}, CSRF token: ${csrfToken}`);
        }

        return {
            id: decode.id,
            token: accessToken,
            csrfToken: csrfToken
        };
    }
}

export class UserTest {
    static async createUser() {
        const salt = await bcrypt.genSalt(10)
        const password = await bcrypt.hash('123', salt);
        const createRole = await prismaClient.roleUser.create({
            data: {
                name: "test_unit_test",
            }
        })

        const data: Array<User> = []

        for (let i = 0; i < 10; i++) {
            data.push({
                id: uuidv4(),
                name: "user_test_" + i,
                email: "testemail_" + i + "@test.com",
                password: password,
                is_deleted: 0,
                role_id: createRole.id,
                createdAt: dayjs().toDate(),
                updatedAt: dayjs().toDate()
            })
            await timeout(50);
        }

        await prismaClient.user.createMany({
            data
        })
    }

    static async deleteMultipleUser() {
        await prismaClient.user.deleteMany({
            where: {
                name: {
                    contains: "user_test_",
                },
                AND: {
                    role: {
                        name: "test_unit_test"
                    }
                }
            }
        })

        await prismaClient.roleUser.deleteMany({
            where: {
                name: "test_unit_test"
            }
        })
    }

    static async deleteUser() {
        await prismaClient.user.delete({
            where: {
                email: "user_unit_test@example.com"
            }
        })
    }

    static async createOneUser() {
        const roleId = await RoleUserTest.findRoleName("user")
        await prismaClient.user.create({
            data: {
                name: "test_unit_test",
                email: "user_unit_test@example.com",
                password: "123",
                is_deleted: 0,
                role_id: roleId!.id
            }
        })
    }

    static async findUserByEmail(email: string) {
        return prismaClient.user.findUnique({
            where: {
                email: email,
                AND: {
                    is_deleted: 0
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
            }
        })
    }
}

export class RoleUserTest {
    static async findRoleName(name: string): Promise<{ id: string } | null> {
        return prismaClient.roleUser.findUnique({
            where: {
                name: name
            },
            select: {
                id: true,
            }
        })
    }
}