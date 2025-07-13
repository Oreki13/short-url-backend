import { NextFunction, Request, Response } from "express";
import { BasicResponse, defaultResponse } from "../model/basic_response_model";
import { UserActivityService } from "../service/user_activity_service";
import { UserRequest } from "../type/user_request";
import { Validation } from "../validation/validation";
import { UserActivityValidation } from "../validation/user_activity_validation";

class UserActivityController {
    /**
     * Log user activity manually (mainly for admin or system use)
     * Normal activities should be logged automatically by the system
     */
    static async logActivity(req: Request, res: Response<BasicResponse>, next: NextFunction) {
        try {
            const userReq = req as UserRequest;
            if (!userReq.id || !userReq.name) {
                return res.status(401).json({
                    status: "ERROR",
                    data: null,
                    code: "UNAUTHORIZED",
                    message: null,
                });
            }

            const request = req.body;
            Validation.validate(UserActivityValidation.CREATE, request);

            await UserActivityService.log(request);

            res.status(201).json({
                ...defaultResponse,
                code: "ACTIVITY_LOGGED",
                message: "Activity logged successfully"
            });
        } catch (e) {
            next(e);
        }
    }
}

export default UserActivityController;
