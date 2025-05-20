import { DefaultArgs, GetFindResult } from "prisma/prisma-client/runtime/library";
import { Prisma } from "@prisma/client";
import { UserNameAndID } from "./user_model";

export type DomainGetAllRequest = {
    page: string,
    limit: string,
    keyword: string,
    sort: "asc" | "desc",
}

export type DomainGetAllResponse = {
    id: string,
    domain: string,
    is_default: number,
    is_deleted: number,
    user: UserNameAndID,
    createdAt: Date,
    updatedAt: Date,
}

export const toDomainGetAllResponse = (data: {
    id: string;
    domain: string;
    is_default: number;
    is_deleted: number;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: string;
        name: string;
    }
}): DomainGetAllResponse => {
    return {
        id: data.id,
        domain: data.domain,
        is_default: data.is_default,
        is_deleted: data.is_deleted,
        user: data.user,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
    };
}

export type DomainStoreRequest = {
    domain: string,
    is_default?: number
}

export type DomainUpdateRequest = {
    domain?: string,
    is_default?: number
}

export type DomainSetDefaultRequest = {
    domain_id: string
}

export type DomainIdRequest = {
    id: string
}
