import { z } from "zod";
import { ActivityType } from "../model/user_activity_model";

const SORT_DIRECTION = ["asc", "desc"] as const;

const ActivityTypeEnum = z.enum([
    ActivityType.LOGIN,
    ActivityType.LOGOUT,
    ActivityType.CREATE_SHORT_LINK,
    ActivityType.DELETE_SHORT_LINK,
    ActivityType.UPDATE_SHORT_LINK,
    ActivityType.CREATE_DOMAIN,
    ActivityType.UPDATE_DOMAIN,
    ActivityType.DELETE_DOMAIN,
    ActivityType.UPDATE_PROFILE,
    ActivityType.CHANGE_PASSWORD,
    ActivityType.TOKEN_REFRESH,
    ActivityType.TOKEN_REVOKE,
    ActivityType.UI_ACTION
]);

export const UserActivityValidation = {
    CREATE: z.object({
        user_id: z.string().uuid(),
        activity_type: ActivityTypeEnum,
        description: z.string().optional(),
        ip_address: z.string().optional(),
        user_agent: z.string().optional(),
        resource_id: z.string().optional(),
        resource_type: z.string().optional(),
    }),
    GET_LIST: z.object({
        page: z.string().max(3).optional().default("1"),
        limit: z.string().max(3).optional().default("10"),
        sort: z.enum(SORT_DIRECTION).optional().default("desc"),
        user_id: z.string().uuid().optional(),
        activity_type: ActivityTypeEnum.optional(),
        search: z.string().max(255).optional().default(""),
    })
};
