import { NextFunction, Request, Response } from "express"
import { BasicResponse, defaultResponse } from "../model/basic_response_model"
import { HeaderAuthRequest, LoginRequest, LoginResponse, RefreshTokenRequest, RevokeTokenRequest, TokenResponse } from "../model/auth_model";
import { Auth_service } from "../service/auth_service";
import { ResponseError } from "../error/response_error";
import jwt from "jsonwebtoken";


class AuthController {
    static async login(req: Request, res: Response<BasicResponse>, next: NextFunction) {
        try {
            const request: LoginRequest = req.body as LoginRequest
            const ipAddress = req.ip || req.socket.remoteAddress || '';
            const userAgent = req.headers['user-agent'] || '';

            const response: LoginResponse = await Auth_service.login(request, ipAddress, userAgent)


            res.status(200).json({
                ...defaultResponse,
                code: "LOGIN_SUCCESS",
                data: {
                    access_token: response.access_token,
                    refresh_token: response.refresh_token,
                    expires_in: response.expires_in
                }
            })

        } catch (e) {
            next(e)
        }
    }
    static async verify(req: Request, res: Response<BasicResponse>, next: NextFunction) {
        try {
            const request: HeaderAuthRequest = req.headers as HeaderAuthRequest
            const response: BasicResponse = await Auth_service.verify(request)

            res.status(200).json(response);
        } catch (e) {
            next(e);
        }
    }

    static async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const request: RefreshTokenRequest = req.body as RefreshTokenRequest
            const response: TokenResponse = await Auth_service.refreshToken(request)

            res.status(200).json({
                ...defaultResponse,
                code: "TOKEN_REFRESHED",
                data: response
            });
        } catch (e) {
            next(e);
        }
    }

    static async revokeToken(req: Request, res: Response<BasicResponse>, next: NextFunction) {
        try {
            const request: RevokeTokenRequest = req.body as RevokeTokenRequest
            const response: BasicResponse = await Auth_service.revokeToken(request)

            res.status(200).json({
                ...defaultResponse,
                code: "TOKEN_REVOKED",
                message: response.message
            });
        } catch (e) {
            next(e);
        }
    }

    static async logout(req: Request, res: Response<BasicResponse>, next: NextFunction) {
        try {
            // Get user id from token
            const authorization = req.headers.authorization;
            if (!authorization) {
                throw new ResponseError(401, "UNAUTHORIZED", "No authorization header");
            }

            const token = authorization.split('Bearer')[1]?.trim();
            const secret = process.env.SECRET_KEY;

            const decoded: any = jwt.verify(token, secret!);
            const userId = decoded.id;

            const response: BasicResponse = await Auth_service.logout(userId);

            res.status(200).json({
                ...defaultResponse,
                code: "LOGOUT_SUCCESS",
                message: response.message
            });
        } catch (e) {
            next(e);
        }
    }

}

export default AuthController