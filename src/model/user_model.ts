import {DefaultArgs, GetFindResult} from "prisma/prisma-client/runtime/library";
import {Prisma} from "@prisma/client";

export type UserNameAndID = {
    id: string,
    name: string | null,
}

export type UserIdRequest = {
    id: string,
}

export type UserDetail = {
    id: string,
    name: string,
    email: string,
    role: { name: string | null },
    createdAt: Date,
    updatedAt: Date,
}

export type UserGetAllRequest = {
    id: string,
    name: string,
    page: string,
    limit: string,
    keyword: string,
    sort: "asc" | "desc",
}

export type UserCreateRequest = {
    name: string,
    email: string,
    password: string,
    role_id: string,
}

export const toUserGetAllResponse = (data: GetFindResult<Prisma.$UserPayload<DefaultArgs>, {
    take: number;
    select: {
        createdAt: boolean;
        role: { select: { name: boolean } };
        name: boolean;
        id: boolean;
        email: boolean;
        updatedAt: boolean
    };
    orderBy: { createdAt: "asc" | "desc" };
    where: any;
    skip: number
}, GetFindResult<any, any, any>>): GetFindResult<Prisma.$UserPayload<DefaultArgs>, {
    take: number;
    select: {
        createdAt: boolean;
        role: { select: { name: boolean } };
        name: boolean;
        id: boolean;
        email: boolean;
        updatedAt: boolean
    };
    orderBy: { createdAt: "asc" | "desc" };
    where: any;
    skip: number
}, any> => {
    return data;
}
