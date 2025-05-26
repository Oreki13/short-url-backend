import { z } from "zod";
import { ActivityType } from "../model/user_activity_model";

export const UserActivityValidation = {
    CREATE: z.object({
        user_id: z.string().uuid(),
        activity_type: z.enum([
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
        ]),
        description: z.string().optional(),
        ip_address: z.string().optional(),
        user_agent: z.string().optional(),
        resource_id: z.string().optional(),
        resource_type: z.string().optional(),
    })
};
