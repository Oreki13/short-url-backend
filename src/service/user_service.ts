import { Pageable } from "../model/page";
import {
    toUserGetAllResponse,
    UserCreateRequest,
    UserDetail,
    UserGetAllRequest,
    UserIdRequest
} from "../model/user_model";
import { Validation } from "../validation/validation";
import { ShortLinkValidation } from "../validation/short_link_validation";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/response_error";
import { UserValidation } from "../validation/user_validation";
import bcrypt from "bcrypt";

export class UserService {
    static async getAllUsers(requestBody: UserGetAllRequest): Promise<Pageable<UserDetail>> {
        const {
            page,
            limit,
            keyword,
            sort,
        }: UserGetAllRequest = Validation.validate(ShortLinkValidation.GETALL, requestBody);
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let condition: any = {
            is_deleted: 0,
            role: {
                isNot: {
                    name: "superAdmin",
                }
            }
        }

        if (keyword.length > 0) {
            condition = {
                ...condition,
                name: {
                    contains: keyword,
                }
            }
        }

        const totalData = await prismaClient.user.count({
            where: condition
        })

        const userData = await prismaClient.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                domain: {
                    select: {
                        domain: true,
                    },
                    where: {
                        is_deleted: 0,
                    }
                },
                role: {
                    select: {
                        name: true,
                    }
                },
                createdAt: true,
                updatedAt: true,
            },
            where: condition,
            orderBy: {
                createdAt: sort
            },
            skip: skip,
            take: parseInt(limit),
        })

        const generateData = userData.map(data => toUserGetAllResponse(data));

        return {
            data: generateData,
            paging: {
                current_page: parseInt(page),
                total_page: Math.ceil(totalData / parseInt(limit)),
                size: parseInt(limit),
                total_data: totalData,
            }
        }
    }

    static async createUser(requestBody: UserCreateRequest): Promise<Object> {
        const {
            name,
            email,
            password,
            role_id,
        }: UserCreateRequest = Validation.validate(UserValidation.CREATEUSER, requestBody);

        const findUserRequested = await prismaClient.user.findUnique({
            where: {
                email: email,
                is_deleted: 0,
            }
        })

        if (findUserRequested !== null) {
            throw new ResponseError(400, "USER_ALREADY_EXISTS", "User already exists");
        }

        const findRole = await prismaClient.roleUser.findUnique({
            where: {
                id: role_id
            }
        })

        if (findRole === null) {
            throw new ResponseError(400, "ROLE_NOT_EXIST", "Role does not exist");
        }

        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash(password, salt);

        return prismaClient.user.create({
            data: {
                name,
                email,
                password: passwordHash,
                role_id,
                is_deleted: 0
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: {
                    select: {
                        name: true,
                    }
                }
            }
        })


    }

    static async deleteUser(requestBody: UserIdRequest): Promise<string> {
        const { id }: UserIdRequest = Validation.validate(UserValidation.IDUSER, requestBody);

        const findUser = await prismaClient.user.findUnique({
            where: {
                id: id,
                is_deleted: 0,
            }
        })

        if (findUser === null) {
            throw new ResponseError(404, "USER_NOT_EXIST", "User does not exist");
        }

        const deleteUser = await prismaClient.user.update({
            where: {
                id,
            },
            data: {
                is_deleted: 1,
            }
        })

        return deleteUser.name + " has been successfully deleted.";
    }

    static async findUserById(requestBody: UserIdRequest): Promise<UserDetail> {
        const { id }: UserIdRequest = Validation.validate(UserValidation.IDUSER, requestBody);

        const findUser = await prismaClient.user.findUnique({
            where: {
                id: id,
                is_deleted: 0
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: {
                    select: {
                        name: true,
                    }
                },
                createdAt: true,
                updatedAt: true,
            }
        })

        if (findUser === null) {
            throw new ResponseError(404, "USER_NOT_EXIST", "User does not exist");
        }

        return findUser;
    }
}