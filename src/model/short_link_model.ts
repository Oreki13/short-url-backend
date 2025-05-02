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

export const toShortLinkGetAllResponse = (data: GetFindResult<Prisma.$DataUrlPayload<DefaultArgs>, {
    take: number;
    select: {
        createdAt: boolean;
        path: boolean;
        destination: boolean;
        id: boolean;
        count_clicks: boolean;
        title: boolean;
        user: { select: { name: string; id: boolean } };
        updatedAt: boolean
    };
    orderBy: { createdAt: string };
    skip: number;
    where: { is_deleted: number; user_id: string }
}, GetFindResult<any, any, any>>): GetFindResult<Prisma.$DataUrlPayload<DefaultArgs>, {
    take: number;
    select: {
        createdAt: boolean;
        path: boolean;
        destination: boolean;
        id: boolean;
        count_clicks: boolean;
        title: boolean;
        user: { select: { name: string; id: boolean } };
        updatedAt: boolean
    };
    orderBy: { createdAt: string };
    skip: number;
    where: { is_deleted: number; user_id: string }
}, any> & { short_url: string } => {
    const domain = process.env.DOMAIN_SHORT || 'http://localhost:3001/';
    return {
        ...data,
        short_url: `${domain}/${data.path}`
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