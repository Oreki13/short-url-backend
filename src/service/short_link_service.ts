import {
    ShortLinkGetAllRequest,
    ShortLinkGetAllResponse,
    ShortLinkStoreRequest, ShortLinkUpdateRequest,
    toShortLinkGetAllResponse
} from "../model/short_link_model";
import { HeaderAuthRequest } from "../model/auth_model";
import { ShortLinkValidation } from "../validation/short_link_validation";
import { Validation } from "../validation/validation";
import { Auth_validation } from "../validation/auth_validation";
import { BasicResponse, defaultResponse } from "../model/basic_response_model";
import { Pageable } from "../model/page";
import { prismaClient } from "../application/database";
import { v4 as uuidv4 } from "uuid";
import { DataUrl } from "@prisma/client";
import dayjs from "dayjs";
import { ResponseError } from "../error/response_error";

export class ShortLinkServices {
    static async getAll(requestBody: ShortLinkGetAllRequest, requestHeader: HeaderAuthRequest): Promise<Pageable<ShortLinkGetAllResponse>> {
        const {
            page,
            limit,
            keyword,
            sort,
        }: ShortLinkGetAllRequest = Validation.validate(ShortLinkValidation.GETALL, requestBody);
        const header: HeaderAuthRequest = Validation.validate(Auth_validation.TOKENHEADER, requestHeader);
        const userId = header["x-control-user"];
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let condition: any = {
            is_deleted: 0,
            user_id: userId,
        }

        if (keyword.length > 0) {
            condition = {
                ...condition,
                title: {
                    contains: keyword,
                }
            }
        }

        const totalData = await prismaClient.dataUrl.count({
            where: {
                is_deleted: 0
            }
        })

        const shortLinks = await prismaClient.dataUrl.findMany({
            select: {
                id: true,
                title: true,
                path: true,
                count_clicks: true,
                createdAt: true,
                destination: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                is_deleted: false
            },
            skip: skip,
            take: parseInt(limit),
            where: condition,
            orderBy: {
                createdAt: sort
            }
        });

        const generateData = shortLinks.map(data => toShortLinkGetAllResponse(data));
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

    static async store(requestBody: ShortLinkStoreRequest, requestHeader: HeaderAuthRequest): Promise<BasicResponse> {
        const request = Validation.validate(ShortLinkValidation.STORE, requestBody);
        const header: HeaderAuthRequest = Validation.validate(Auth_validation.TOKENHEADER, requestHeader);
        const userId = header["x-control-user"];
        const id = uuidv4()

        const findDataUrl = await prismaClient.dataUrl.findFirst({
            where: {
                user_id: userId,
                OR: [
                    {
                        title: request.title,
                    },
                    {
                        path: request.path,
                    }
                ]
            }
        })

        if (findDataUrl !== null && findDataUrl.is_deleted === 0) {
            throw new ResponseError(400, "DATA_ALREADY_EXIST", "Path has exist");
        }

        // Remove all leading slashes from the path
        while (request.path.startsWith("/")) {
            request.path = request.path.substring(1);
        }

        if (findDataUrl !== null && findDataUrl.is_deleted === 1) {
            await prismaClient.dataUrl.update({
                where: {
                    id: findDataUrl.id,
                },
                data: {
                    title: request.title,
                    destination: request.destination,
                    path: request.path,
                    is_deleted: 0,
                    count_clicks: 0,
                    createdAt: dayjs(Date.now()).toDate(),
                    updatedAt: dayjs(Date.now()).toDate()
                }
            })
            return {
                ...defaultResponse,
                code: "SUCCESS_ADD_LINK",
                data: {
                    id: findDataUrl.id,
                    title: request.title,
                    path: request.path,
                    destination: request.destination,
                }
            };
        }

        const data: DataUrl = {
            id: id,
            user_id: userId?.toString()!,
            path: request.path,
            destination: request.destination,
            count_clicks: 0,
            title: request.title,
            is_deleted: 0,
            createdAt: dayjs(Date.now()).toDate(),
            updatedAt: dayjs(Date.now()).toDate()
        }

        await prismaClient.dataUrl.create({
            data: data
        })

        return {
            ...defaultResponse,
            code: "SUCCESS_ADD_LINK",
            data: {
                id: data.id,
                title: data.title,
                path: data.path,
                destination: data.destination
            }
        };
    }

    static async update(requestBody: ShortLinkUpdateRequest, shortLinkId: string): Promise<BasicResponse> {
        const { title, destination, path } = Validation.validate(ShortLinkValidation.UPDATE, requestBody);

        const findDataUrl = await prismaClient.dataUrl.findUnique({
            where: {
                id: shortLinkId,
                is_deleted: 0,
            }
        })

        if (findDataUrl === null) {
            throw new ResponseError(404, "DATA_NOT_EXIST", "Data does not exist");
        }

        const updateData = await prismaClient.dataUrl.update({
            where: {
                id: shortLinkId,
            },
            data: {
                title: title ?? findDataUrl.title,
                destination: destination ?? findDataUrl.destination,
                path: path ?? findDataUrl.path,
            }
        })

        return {
            ...defaultResponse,
            code: "SUCCESS_EDIT_LINK",
            data: {
                id: updateData.id,
                title: updateData.title,
                path: updateData.path,
                destination: updateData.destination
            }
        };
    }

    static async delete(shortLinkId: string): Promise<BasicResponse> {
        const data = Validation.validate(ShortLinkValidation.SHORTLINKID, { "id": shortLinkId });

        const findDataUrl = await prismaClient.dataUrl.findUnique({
            where: {
                id: data.id,
                is_deleted: 0,
            }
        })

        if (findDataUrl === null) {
            throw new ResponseError(404, "DATA_NOT_EXIST", "Data does not exist");
        }

        const deleteData = await prismaClient.dataUrl.update({
            where: {
                id: data.id,
            },
            data: {
                is_deleted: 1,
            }
        });

        return {
            ...defaultResponse,
            code: "SUCCESS_DELETE_LINK",
            data: {
                id: deleteData.id,
                title: deleteData.title,
                path: deleteData.path,
                destination: deleteData.destination
            }
        };
    }
}