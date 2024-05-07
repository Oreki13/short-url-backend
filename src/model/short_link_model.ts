import {UserNameAndID} from "./user_model";
import {DefaultArgs, GetFindResult} from "prisma/prisma-client/runtime/library";
import {Prisma} from "@prisma/client";

export type ShortLinkGetAllRequest = {
    page: string,
    limit: string,
    keyword: string,
    sort: "asc" | "desc",
}

export type ShortLinkGetAllResponse = {
    id: string,
    title: string,
    back_half: string,
    count_clicks: number,
    destination: string,
    user: UserNameAndID
    createdAt: Date,
    updatedAt: Date,
}

export const toShortLinkGetAllResponse = (data: GetFindResult<Prisma.$DataUrlPayload<DefaultArgs>, {
    take: number;
    select: {
        createdAt: boolean;
        back_half: boolean;
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
}>): GetFindResult<Prisma.$DataUrlPayload<DefaultArgs>, {
    take: number;
    select: {
        createdAt: boolean;
        back_half: boolean;
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
}> => {
    return data;
}

export type ShortLinkStoreRequest = {
    title: string,
    destination: string,
    backHalf: string
}

export type ShortLinkUpdateRequest = {
    title: string | undefined,
    destination: string | undefined,
    backHalf: string | undefined
}