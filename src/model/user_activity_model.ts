import { z } from "zod";
import { BasicResponse } from "./basic_response_model";

export const ActivityType = {
    LOGIN: "LOGIN",
    LOGOUT: "LOGOUT",
    CREATE_SHORT_LINK: "CREATE_SHORT_LINK",
    DELETE_SHORT_LINK: "DELETE_SHORT_LINK",
    UPDATE_SHORT_LINK: "UPDATE_SHORT_LINK",
    CREATE_DOMAIN: "CREATE_DOMAIN",
    UPDATE_DOMAIN: "UPDATE_DOMAIN",
    DELETE_DOMAIN: "DELETE_DOMAIN",
    UPDATE_PROFILE: "UPDATE_PROFILE",
    CHANGE_PASSWORD: "CHANGE_PASSWORD",
    TOKEN_REFRESH: "TOKEN_REFRESH",
    TOKEN_REVOKE: "TOKEN_REVOKE",
    UI_ACTION: "UI_ACTION"           // Generic activity type for UI actions
} as const;

export type ActivityTypeValue = typeof ActivityType[keyof typeof ActivityType];

export interface UserActivityRequest {
    user_id: string;
    activity_type: ActivityTypeValue;
    description?: string;
    ip_address?: string;
    user_agent?: string;
    resource_id?: string;
    resource_type?: string;
}

export interface UserActivityResponse {
    id: string;
    user_id: string;
    activity_type: string;
    description?: string;
    ip_address?: string;
    user_agent?: string;
    resource_id?: string;
    resource_type?: string;
    createdAt: Date;
}

export interface UserActivityPageResponse extends BasicResponse {
    data: UserActivityResponse[];
    paging: {
        current_page: number;
        total_page: number;
        size: number;
    }
}
