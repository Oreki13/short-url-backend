import { prismaClient } from "../application/database";
import { ResponseError } from "../error/response_error";
import { Prisma } from "@prisma/client";
import { Pageable } from "../model/page";
import {
    ActivityTypeValue,
    UserActivityListQuery,
    UserActivityListRequest,
    UserActivityRequest,
    UserActivityResponse
} from "../model/user_activity_model";
import { Validation } from "../validation/validation";
import { UserActivityValidation } from "../validation/user_activity_validation";

export class UserActivityService {
    /**
     * Log user activity
     * @param request UserActivityRequest
     * @returns UserActivityResponse
     */
    static async log(request: UserActivityRequest): Promise<UserActivityResponse> {
        // Validate request using zod schema
        Validation.validate(UserActivityValidation.CREATE, request);

        try {
            // Check if user exists
            const user = await prismaClient.user.findUnique({
                where: { id: request.user_id, is_deleted: 0 }
            });

            if (!user) {
                throw new ResponseError(404, "NOT_FOUND", "User not found");
            }

            // Create user activity
            const activity = await prismaClient.userActivity.create({
                data: {
                    user_id: request.user_id,
                    activity_type: request.activity_type,
                    description: request.description,
                    ip_address: request.ip_address,
                    user_agent: request.user_agent,
                    resource_id: request.resource_id,
                    resource_type: request.resource_type,
                }
            });

            return this.toUserActivityResponse(activity);
        } catch (error) {
            if (error instanceof ResponseError) {
                throw error;
            }
            throw new ResponseError(500, "ERROR", "Failed to log user activity");
        }
    }

    static async getActivities(requestQuery: UserActivityListRequest): Promise<Pageable<UserActivityResponse>> {
        const {
            page,
            limit,
            sort,
            user_id,
            activity_type,
            search,
        } = Validation.validate(UserActivityValidation.GET_LIST, requestQuery) as UserActivityListQuery;

        const pageNumber = Math.max(Number.parseInt(page, 10) || 1, 1);
        const limitNumber = Math.max(Number.parseInt(limit, 10) || 10, 1);
        const skip = (pageNumber - 1) * limitNumber;

        const whereClause: Prisma.UserActivityWhereInput = {};

        if (user_id) {
            whereClause.user_id = user_id;
        }

        if (activity_type) {
            whereClause.activity_type = activity_type;
        }

        const keyword = search.trim();

        if (keyword) {
            whereClause.OR = [
                { description: { contains: keyword, mode: "insensitive" } },
                { resource_type: { contains: keyword, mode: "insensitive" } },
                { resource_id: { contains: keyword, mode: "insensitive" } },
                { ip_address: { contains: keyword, mode: "insensitive" } },
            ];
        }

        const totalData = await prismaClient.userActivity.count({ where: whereClause });
        const activities = await prismaClient.userActivity.findMany({
            where: whereClause,
            orderBy: {
                createdAt: sort,
            },
            skip,
            take: limitNumber,
        });

        const data = activities.map(activity => this.toUserActivityResponse(activity));

        return {
            data,
            paging: {
                current_page: pageNumber,
                total_page: limitNumber > 0 ? Math.ceil(totalData / limitNumber) : 0,
                size: limitNumber,
                total_data: totalData,
            },
        };
    }

    /**
     * Log activity helper method - simple version for common activities
     * @param userId User ID
     * @param activityType Activity type
     * @param description Optional description
     * @param ipAddress Optional IP address
     * @param userAgent Optional user agent
     * @param resourceId Optional resource ID
     * @param resourceType Optional resource type
     */
    static async logActivity(
        userId: string,
        activityType: ActivityTypeValue,
        description?: string,
        ipAddress?: string,
        userAgent?: string,
        resourceId?: string,
        resourceType?: string
    ): Promise<void> {
        try {
            await this.log({
                user_id: userId,
                activity_type: activityType,
                description,
                ip_address: ipAddress,
                user_agent: userAgent,
                resource_id: resourceId,
                resource_type: resourceType
            });
        } catch (error) {
            // Log error but don't interrupt the flow
            console.error("Failed to log user activity:", error);
        }
    }

    /**
     * Convert Prisma model to response model
     */
    private static toUserActivityResponse(activity: any): UserActivityResponse {
        return {
            id: activity.id,
            user_id: activity.user_id,
            activity_type: activity.activity_type,
            description: activity.description,
            ip_address: activity.ip_address,
            user_agent: activity.user_agent,
            resource_id: activity.resource_id,
            resource_type: activity.resource_type,
            createdAt: activity.createdAt
        };
    }
}
