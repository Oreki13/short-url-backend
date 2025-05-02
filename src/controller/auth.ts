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

            const response: LoginResponse = await Auth_service.login(request, ipAddress, userAgent, res)

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
            const request: HeaderAuthRequest = {
                authorization: req.headers.authorization,
                "x-control-user": req.headers["x-control-user"] as string || "",
                cookies: req.cookies // Tambahkan cookies untuk verifikasi
            };
            const response: BasicResponse = await Auth_service.verify(request)

            res.status(200).json(response);
        } catch (e) {
            next(e);
        }
    }

    static async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const request: RefreshTokenRequest = {
                ...req.body as RefreshTokenRequest,
                cookies: req.cookies // Tambahkan cookies untuk refresh token
            };
            const response: TokenResponse = await Auth_service.refreshToken(request, res)

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
            const request: RevokeTokenRequest = {
                ...req.body as RevokeTokenRequest,
                cookies: req.cookies // Tambahkan cookies
            };
            const response: BasicResponse = await Auth_service.revokeToken(request, res)

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
            let userId: string;

            if (authorization) {
                const token = authorization.split('Bearer')[1]?.trim();
                const secret = process.env.SECRET_KEY;
                const decoded: any = jwt.verify(token, secret!, { algorithms: ['HS256'] });
                userId = decoded.id;
            } else if (req.cookies?.accessToken) {
                // Ambil dari cookie jika tidak ada di header
                const token = req.cookies.accessToken;
                const secret = process.env.SECRET_KEY;
                const decoded: any = jwt.verify(token, secret!, { algorithms: ['HS256'] });
                userId = decoded.id;
            } else {
                throw new ResponseError(401, "UNAUTHORIZED", "No authorization found");
            }

            const response: BasicResponse = await Auth_service.logout(userId, res);

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