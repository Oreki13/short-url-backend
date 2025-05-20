import {
    DomainGetAllRequest,
    DomainGetAllResponse,
    DomainIdRequest,
    DomainSetDefaultRequest,
    DomainStoreRequest,
    DomainUpdateRequest,
    toDomainGetAllResponse
} from "../model/domain_model";
import { HeaderAuthRequest } from "../model/auth_model";
import { DomainValidation } from "../validation/domain_validation";
import { Validation } from "../validation/validation";
import { Auth_validation } from "../validation/auth_validation";
import { BasicResponse, defaultResponse } from "../model/basic_response_model";
import { Pageable } from "../model/page";
import { prismaClient } from "../application/database";
import { v4 as uuidv4 } from "uuid";
import { Domain } from "@prisma/client";
import dayjs from "dayjs";
import { ResponseError } from "../error/response_error";

export class DomainServices {
    static async getAll(requestBody: DomainGetAllRequest, requestHeader: HeaderAuthRequest): Promise<Pageable<DomainGetAllResponse>> {
        const {
            page,
            limit,
            keyword,
            sort,
        }: DomainGetAllRequest = Validation.validate(DomainValidation.GETALL, requestBody);
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
                domain: {
                    contains: keyword,
                }
            }
        }

        const totalData = await prismaClient.domain.count({
            where: condition
        })

        const domains = await prismaClient.domain.findMany({
            select: {
                id: true,
                domain: true,
                is_default: true,
                is_deleted: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
            skip: skip,
            take: parseInt(limit),
            where: condition,
            orderBy: {
                createdAt: sort
            }
        });

        const generateData = domains.map(data => toDomainGetAllResponse(data));
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

    static async store(requestBody: DomainStoreRequest, requestHeader: HeaderAuthRequest): Promise<BasicResponse> {
        const request = Validation.validate(DomainValidation.STORE, requestBody);
        const header: HeaderAuthRequest = Validation.validate(Auth_validation.TOKENHEADER, requestHeader);
        const userId = header["x-control-user"];
        const id = uuidv4();

        // Remove protocol from domain
        let domainOnly = request.domain;

        // Remove trailing slashes from domain
        while (domainOnly.endsWith("/")) {
            domainOnly = domainOnly.slice(0, -1);
        }

        const findDomain = await prismaClient.domain.findFirst({
            where: {
                user_id: userId,
                domain: domainOnly
            }
        });

        if (findDomain !== null && findDomain.is_deleted === 0) {
            throw new ResponseError(400, "DATA_ALREADY_EXIST", "Domain has already been registered");
        }

        // If is_default is 1, reset all other domains to is_default = 0
        if (request.is_default === 1) {
            await prismaClient.domain.updateMany({
                where: {
                    user_id: userId,
                    is_deleted: 0
                },
                data: {
                    is_default: 0
                }
            });
        }

        if (findDomain !== null && findDomain.is_deleted === 1) {
            await prismaClient.domain.update({
                where: {
                    id: findDomain.id,
                },
                data: {
                    domain: domainOnly,
                    is_default: request.is_default || 0,
                    is_deleted: 0,
                    createdAt: dayjs(Date.now()).toDate(),
                    updatedAt: dayjs(Date.now()).toDate()
                }
            });

            return {
                ...defaultResponse,
                code: "SUCCESS_ADD_DOMAIN",
                data: {
                    id: findDomain.id,
                    domain: domainOnly,
                    is_default: request.is_default || 0
                }
            };
        }

        const data: Domain = {
            id: id,
            user_id: userId?.toString()!,
            domain: domainOnly,
            is_default: request.is_default || 0,
            is_deleted: 0,
            createdAt: dayjs(Date.now()).toDate(),
            updatedAt: dayjs(Date.now()).toDate()
        };

        await prismaClient.domain.create({
            data: data
        });

        return {
            ...defaultResponse,
            code: "SUCCESS_ADD_DOMAIN",
            data: {
                id: data.id,
                domain: data.domain,
                is_default: data.is_default
            }
        };
    }

    static async update(requestBody: DomainUpdateRequest, domainId: string): Promise<BasicResponse> {
        const { domain, is_default } = Validation.validate(DomainValidation.UPDATE, requestBody);
        const id = Validation.validate(DomainValidation.DOMAIN_ID, { id: domainId });

        const findDomain = await prismaClient.domain.findUnique({
            where: {
                id: id.id,
                is_deleted: 0,
            },
            include: {
                user: {
                    select: {
                        id: true
                    }
                }
            }
        });

        if (findDomain === null) {
            throw new ResponseError(404, "DATA_NOT_EXIST", "Domain does not exist");
        }

        let domainWithoutProtocol = domain;
        if (domain) {
            // Remove trailing slashes from domain
            while (domainWithoutProtocol!.endsWith("/")) {
                domainWithoutProtocol = domainWithoutProtocol!.slice(0, -1);
            }
        }

        // If setting as default, reset all other domains to non-default
        if (is_default === 1) {
            await prismaClient.domain.updateMany({
                where: {
                    user_id: findDomain.user_id,
                    is_deleted: 0
                },
                data: {
                    is_default: 0
                }
            });
        }

        const updateData = await prismaClient.domain.update({
            where: {
                id: id.id,
            },
            data: {
                domain: domainWithoutProtocol ?? findDomain.domain,
                is_default: is_default ?? findDomain.is_default,
            }
        });

        return {
            ...defaultResponse,
            code: "SUCCESS_UPDATE_DOMAIN",
            data: {
                id: updateData.id,
                domain: updateData.domain,
                is_default: updateData.is_default
            }
        };
    }

    static async delete(domainId: string): Promise<BasicResponse> {
        const data = Validation.validate(DomainValidation.DOMAIN_ID, { "id": domainId });

        const findDomain = await prismaClient.domain.findUnique({
            where: {
                id: data.id,
                is_deleted: 0,
            }
        });

        if (findDomain === null) {
            throw new ResponseError(404, "DATA_NOT_EXIST", "Domain does not exist");
        }

        const deleteDomain = await prismaClient.domain.update({
            where: {
                id: data.id,
            },
            data: {
                is_deleted: 1,
            }
        });

        return {
            ...defaultResponse,
            code: "SUCCESS_DELETE_DOMAIN",
            message: "Domain has been successfully deleted.",
            data: {
                id: deleteDomain.id,
                domain: deleteDomain.domain,
                is_default: deleteDomain.is_default
            }
        };
    }

    static async setDefault(requestBody: DomainSetDefaultRequest, requestHeader: HeaderAuthRequest): Promise<BasicResponse> {
        const request = Validation.validate(DomainValidation.SET_DEFAULT, requestBody);
        const header: HeaderAuthRequest = Validation.validate(Auth_validation.TOKENHEADER, requestHeader);
        const userId = header["x-control-user"];

        const findDomain = await prismaClient.domain.findUnique({
            where: {
                id: request.domain_id,
                is_deleted: 0,
                user_id: userId
            }
        });

        if (findDomain === null) {
            throw new ResponseError(404, "DATA_NOT_EXIST", "Domain does not exist");
        }

        // Reset all domains to non-default
        await prismaClient.domain.updateMany({
            where: {
                user_id: userId,
                is_deleted: 0
            },
            data: {
                is_default: 0
            }
        });

        // Set this domain as default
        const updateData = await prismaClient.domain.update({
            where: {
                id: request.domain_id,
            },
            data: {
                is_default: 1,
            }
        });

        return {
            ...defaultResponse,
            code: "SUCCESS_SET_DEFAULT_DOMAIN",
            message: "Default domain has been successfully set.",
            data: {
                id: updateData.id,
                domain: updateData.domain,
                is_default: updateData.is_default
            }
        };
    }
}
