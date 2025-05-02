import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { defaultResponse } from "../model/basic_response_model";
import { UserRequest } from "../type/user_request";

export const authMiddleware = async (req: UserRequest, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;
    const userId = req.headers['x-control-user'];
    const accessTokenCookie = req.cookies?.accessToken;
    const secretKey = process.env.SECRET_KEY;

    // Jika tidak ada token (baik di header maupun di cookie), kembalikan error
    if (!authorization && !accessTokenCookie) {
        return res.status(401).json({
            ...defaultResponse,
            status: "ERROR",
            code: "UNAUTHORIZED",
            message: "Authentication required"
        }).end();
    }

    // Jika tidak ada x-control-user header, kembalikan error
    if (!userId) {
        return res.status(401).json({
            ...defaultResponse,
            status: "ERROR",
            code: "UNAUTHORIZED",
            message: "User identification missing"
        }).end();
    }

    try {
        let accessToken: string | undefined;

        // Coba ambil token dari header Authorization
        if (authorization && authorization.includes("Bearer")) {
            accessToken = authorization.split('Bearer')[1].trim();
        }
        // Jika tidak ada di header, coba ambil dari cookie
        else if (accessTokenCookie) {
            accessToken = accessTokenCookie;
        }
        else {
            return res.status(401).json({
                ...defaultResponse,
                status: "ERROR",
                code: "INVALID_TOKEN_FORMAT",
                message: "Invalid token format"
            }).end();
        }

        // Verifikasi token
        jwt.verify(accessToken ?? "", secretKey!, { algorithms: ["HS256"] }, (err, decoded: any) => {
            if (err && err.name === "TokenExpiredError") {
                return res.status(401).json({
                    ...defaultResponse,
                    status: "ERROR",
                    code: "TOKEN_EXPIRED",
                    message: "Token has been expired"
                }).end();
            }

            if (err && err.name === "JsonWebTokenError") {
                return res.status(401).json({
                    ...defaultResponse,
                    status: "ERROR",
                    code: "INVALID_TOKEN",
                    message: "Token is invalid"
                }).end();
            }

            if (userId !== decoded!.id) {
                return res.status(401).json({
                    ...defaultResponse,
                    status: "ERROR",
                    code: "INVALID_USER_TOKEN",
                    message: "Invalid token user"
                }).end();
            }

            // Set informasi user ke request
            req.id = decoded.id;
            req.name = decoded.name;
            next();
        });
    } catch (error) {
        return res.status(401).json({
            ...defaultResponse,
            status: "ERROR",
            code: "AUTHENTICATION_ERROR",
            message: "Failed to authenticate"
        }).end();
    }
}