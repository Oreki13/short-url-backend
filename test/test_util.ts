import {prismaClient} from "../src/application/database";
import {DataUrl, User} from "@prisma/client";
import dayjs from "dayjs";
import {v4 as uuidv4} from "uuid";
import supertest from "supertest";
import {web} from "../src/application/web";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export class ShortLinkTest {
    static async addMultipleData() {
        const data: Array<DataUrl> = []

        for (let i = 0; i < 10; i++) {
            let currentTime = dayjs();
            if (i == 9) {
                currentTime = dayjs().add(5, "second");
            }
            data.push({
                id: uuidv4(),
                user_id: "b111d9cd-71d8-4e51-aff1-8bc2384092b8",
                back_half: "test_unit_test_path_" + i.toString(),
                destination: "https://google.com",
                count_clicks: 0,
                title: "test_unit_test " + i.toString(),
                is_deleted: 0,
                createdAt: currentTime.toDate(),
                updatedAt: currentTime.toDate()
            })
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
        const checkIfAvail = await prismaClient.dataUrl.findUnique({
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
                    title: "test_unit_test",
                    user: {
                        email: "superadmin@mail.com"
                    }
                }
            })
        }
    }
}

export class AuthUserTest {
    static async login(email: string): Promise<{ id: string, token: string }> {
        const login = await supertest(web)
            .post("/auth/login")
            .send({
                email: email,
                password: "123"
            });
        const decode: any = jwt.decode(login.body.data)
        return {
            id: decode!.id,
            token: login.body.data,
        }
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
            let currentTime = dayjs();
            if (i == 9) {
                currentTime = dayjs().add(5, "second");
            }
            data.push({
                id: uuidv4(),
                name: "user_test_" + i,
                email: "testemail_" + i + "@test.com",
                password: password,
                is_deleted: 0,
                role_id: createRole.id,
                createdAt: currentTime.toDate(),
                updatedAt: currentTime.toDate()
            })
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