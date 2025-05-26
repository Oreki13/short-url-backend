import { Request } from "express";
import { ActivityTypeValue } from "../model/user_activity_model";
import { UserActivityService } from "../service/user_activity_service";

/**
 * Helper class for logging user activities
 */
export class ActivityLogger {
    /**
     * Log user activity from a request
     * @param userId User ID
     * @param activityType Activity type
     * @param req Express request object
     * @param description Optional description
     * @param resourceId Optional resource ID
     * @param resourceType Optional resource type
     */
    static async logFromRequest(
        userId: string,
        activityType: ActivityTypeValue,
        req: Request,
        description?: string,
        resourceId?: string,
        resourceType?: string
    ): Promise<void> {
        const ipAddress = req.ip || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';

        await UserActivityService.logActivity(
            userId,
            activityType,
            description,
            ipAddress,
            userAgent,
            resourceId,
            resourceType
        );
    }

    /**
     * Log login activity
     * @param userId User ID
     * @param req Express request object
     */
    static async logLogin(userId: string, req: Request): Promise<void> {
        await this.logFromRequest(userId, "LOGIN", req, "User logged in");
    }

    /**
     * Log logout activity
     * @param userId User ID
     * @param req Express request object
     */
    static async logLogout(userId: string, req: Request): Promise<void> {
        await this.logFromRequest(userId, "LOGOUT", req, "User logged out");
    }

    /**
     * Log token refresh activity
     * @param userId User ID
     * @param req Express request object
     */
    static async logTokenRefresh(userId: string, req: Request): Promise<void> {
        await this.logFromRequest(userId, "TOKEN_REFRESH", req, "User refreshed token");
    }

    /**
     * Log token revoke activity
     * @param userId User ID
     * @param req Express request object
     */
    static async logTokenRevoke(userId: string, req: Request): Promise<void> {
        await this.logFromRequest(userId, "TOKEN_REVOKE", req, "User revoked token");
    }

    /**
     * Log short link creation activity
     * @param userId User ID
     * @param req Express request object
     * @param shortLinkId Short link ID
     */
    static async logShortLinkCreation(userId: string, req: Request, shortLinkId: string): Promise<void> {
        await this.logFromRequest(
            userId,
            "CREATE_SHORT_LINK",
            req,
            "Short link created",
            shortLinkId,
            "DataUrl"
        );
    }

    /**
     * Log short link update activity
     * @param userId User ID
     * @param req Express request object
     * @param shortLinkId Short link ID
     */
    static async logShortLinkUpdate(userId: string, req: Request, shortLinkId: string): Promise<void> {
        await this.logFromRequest(
            userId,
            "UPDATE_SHORT_LINK",
            req,
            "Short link updated",
            shortLinkId,
            "DataUrl"
        );
    }

    /**
     * Log short link deletion activity
     * @param userId User ID
     * @param req Express request object
     * @param shortLinkId Short link ID
     */
    static async logShortLinkDeletion(userId: string, req: Request, shortLinkId: string): Promise<void> {
        await this.logFromRequest(
            userId,
            "DELETE_SHORT_LINK",
            req,
            "Short link deleted",
            shortLinkId,
            "DataUrl"
        );
    }

    /**
     * Log domain creation activity
     * @param userId User ID
     * @param req Express request object
     * @param domainId Domain ID
     */
    static async logDomainCreation(userId: string, req: Request, domainId: string): Promise<void> {
        await this.logFromRequest(
            userId,
            "CREATE_DOMAIN",
            req,
            "Domain created",
            domainId,
            "Domain"
        );
    }

    /**
     * Log domain update activity
     * @param userId User ID
     * @param req Express request object
     * @param domainId Domain ID
     */
    static async logDomainUpdate(userId: string, req: Request, domainId: string): Promise<void> {
        await this.logFromRequest(
            userId,
            "UPDATE_DOMAIN",
            req,
            "Domain updated",
            domainId,
            "Domain"
        );
    }

    /**
     * Log domain deletion activity
     * @param userId User ID
     * @param req Express request object
     * @param domainId Domain ID
     */
    static async logDomainDeletion(userId: string, req: Request, domainId: string): Promise<void> {
        await this.logFromRequest(
            userId,
            "DELETE_DOMAIN",
            req,
            "Domain deleted",
            domainId,
            "Domain"
        );
    }

    /**
     * Log profile update activity
     * @param userId User ID
     * @param req Express request object
     */
    static async logProfileUpdate(userId: string, req: Request): Promise<void> {
        await this.logFromRequest(
            userId,
            "UPDATE_PROFILE",
            req,
            "User profile updated",
            userId,
            "User"
        );
    }

    /**
     * Log password change activity
     * @param userId User ID
     * @param req Express request object
     */
    static async logPasswordChange(userId: string, req: Request): Promise<void> {
        await this.logFromRequest(
            userId,
            "CHANGE_PASSWORD",
            req,
            "User password changed",
            userId,
            "User"
        );
    }
}
