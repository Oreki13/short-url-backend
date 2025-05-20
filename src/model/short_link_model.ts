import { UserNameAndID } from "./user_model";
import { DefaultArgs, GetFindResult } from "prisma/prisma-client/runtime/library";
import { Prisma } from "@prisma/client";

export type ShortLinkGetAllRequest = {
    page: string,
    limit: string,
    keyword: string,
    sort: "asc" | "desc",
}

export type ShortLinkGetAllResponse = {
    id: string,
    title: string,
    path: string,
    count_clicks: number,
    destination: string,
    short_url: string,
    user: UserNameAndID
    createdAt: Date,
    updatedAt: Date,
}

export const toShortLinkGetAllResponse = (data: {
    id: string;
    title: string;
    path: string;
    count_clicks: number;
    destination: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: string;
        name: string;
        domain: {
            domain: string;
            is_default: number;
        }[];
    }
}): ShortLinkGetAllResponse => {
    const defaultDomain = process.env.DOMAIN_SHORT || 'http://localhost:3001/';
    const domainPrefix = data.user.domain?.length > 0
        ? data.user.domain.find(d => d.is_default === 1)?.domain || defaultDomain
        : defaultDomain;

    return {
        id: data.id,
        title: data.title,
        path: data.path,
        count_clicks: data.count_clicks,
        destination: data.destination,
        short_url: `${domainPrefix}/${data.path}`,
        user: {
            id: data.user.id,
            name: data.user.name,
        },
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
    };
}

export type ShortLinkStoreRequest = {
    title: string,
    destination: string,
    path: string
}

export type ShortLinkUpdateRequest = {
    title: string | undefined,
    destination: string | undefined,
    path: string | undefined
}