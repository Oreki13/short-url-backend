import { prismaClient } from "../application/database";
import { ResponseError } from "../error/response_error";
import { ActivityTypeValue, UserActivityRequest, UserActivityResponse } from "../model/user_activity_model";
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
