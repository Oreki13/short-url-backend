import {NextFunction, Response} from "express";
import {BasicResponse, defaultResponse} from "../model/basic_response_model";
import {UserCreateRequest, UserGetAllRequest, UserIdRequest} from "../model/user_model";
import {UserService} from "../service/user_service";
import {UserRequest} from "../type/user_request";

export class UserController {
    static async getListUsers(req: UserRequest, res: Response<BasicResponse>, next: NextFunction) {
        try {
            const request: UserGetAllRequest = req.query as unknown as UserGetAllRequest;
            const response = await UserService.getAllUsers(request);

            res.status(200).json({
                ...defaultResponse, code: "SUCCESS", data: response,
            });
        } catch (err) {
            next(err);
        }
    }

    static async createUser(req: UserRequest, res: Response<BasicResponse>, next: NextFunction) {
        try {
            const request: UserCreateRequest = req.body as UserCreateRequest;
            const response = await UserService.createUser(request);

            res.status(200).json({
                ...defaultResponse, code: "SUCCESS", data: response,
            })
        } catch (err) {
            next(err);
        }
    }

    static async deleteUser(req: UserRequest, res: Response<BasicResponse>, next: NextFunction) {
        try {
            const request: UserIdRequest = req.params as UserIdRequest;
            const response = await UserService.deleteUser(request);

            res.status(200).json({
                ...defaultResponse, code: "SUCCESS", message: response,
            })
        } catch (err) {
            next(err);
        }
    }

    static async findUserById(req: UserRequest, res: Response<BasicResponse>, next: NextFunction) {
        try {
            const request: UserIdRequest = req.params as UserIdRequest;
            const response = await UserService.findUserById(request);

            res.status(200).json({
                ...defaultResponse, code: "SUCCESS", data: response,
            })
        } catch (err) {
            next(err);
        }
    }
}