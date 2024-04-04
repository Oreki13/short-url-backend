import {
    ShortLinkGetAllRequest,
    ShortLinkGetAllResponse,
    ShortLinkStoreRequest,
    toShortLinkGetAllResponse
} from "../model/short_link_model";
import {HeaderAuthRequest} from "../model/auth_model";
import {ShortLinkValidation} from "../validation/short_link_validation";
import {Validation} from "../validation/validation";
import {AuthValidation} from "../validation/auth-validation";
import {BasicResponse, defaultResponse} from "../model/basic_response_model";
import {Pageable} from "../model/page";
import {prismaClient} from "../application/database";
import {v4 as uuidv4} from "uuid";
import {DataUrl} from "@prisma/client";
import dayjs from "dayjs";
import {ResponseError} from "../error/response_error";
import {remove} from "winston";

export class ShortLinkServices {
    static async getAll(requestBody: ShortLinkGetAllRequest, requestHeader: HeaderAuthRequest): Promise<Pageable<ShortLinkGetAllResponse>> {
        const body: ShortLinkGetAllRequest = Validation.validate(ShortLinkValidation.GETALL, requestBody);
        const header: HeaderAuthRequest = Validation.validate(AuthValidation.TOKENHEADER, requestHeader);
        const userId = header["x-control-user"];
        const skip = (body.page - 1) * body.limit;

        const totalData = await prismaClient.dataUrl.count({
            where: {
                is_deleted: 0
            }
        })

        const shortLinks = await prismaClient.dataUrl.findMany({
            select: {
                id: true,
                title: true,
                back_half: true,
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
            take: body.limit,
            where: {is_deleted: 0, user_id: userId},
            orderBy: {
                createdAt: 'asc'
            }

        });

        return {
            data: shortLinks.map(data => toShortLinkGetAllResponse(data)),
            paging: {
                current_page: body.page,
                total_page: Math.ceil(totalData / body.limit),
                size: body.limit
            }
        }
    }

    static async store(requestBody: ShortLinkStoreRequest, requestHeader: HeaderAuthRequest): Promise<BasicResponse> {
        const request = Validation.validate(ShortLinkValidation.STORE, requestBody);
        const header: HeaderAuthRequest = Validation.validate(AuthValidation.TOKENHEADER, requestHeader);
        const userId = header["x-control-user"];
        const id = uuidv4()

        const findDataUrl = await prismaClient.dataUrl.findFirst({
            where: {
                back_half: request.backHalf,
                title: request.title,
            }
        })

        if (findDataUrl !== null) {
            throw new ResponseError(400, "DATA_ALREADY_EXIST", "Title or backhalf has exist");
        }

        const data: DataUrl = {
            id: id,
            user_id: userId?.toString()!,
            back_half: request.backHalf,
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
                back_half: data.back_half,
                destination: data.destination
            }
        };
    }
}