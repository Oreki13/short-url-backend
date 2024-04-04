import {Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import {defaultResponse} from "../model/basic_response_model";
import {UserRequest} from "../type/user_request";
import {logger} from "../application/logger";

export const authMiddleware = async (req: UserRequest, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization
    const userId = req.headers['x-control-user']
    const secretKey = process.env.SECRET_KEY;
    if (authorization !== null && userId !== null) {

        if (authorization!.includes("Bearer")) {

            const accessToken = authorization?.split('Bearer')[1].trim();

            jwt.verify(accessToken!, secretKey!, (err, decoded: any) => {

                if (err && err.name === "TokenExpiredError") {
                    res.status(401).json({
                        ...defaultResponse,
                        status: "ERROR",
                        code: "TOKEN_EXPIRED",
                        message: "Token has been expired"
                    }).end()
                    return;
                }
                if (err && err.name === "JsonWebTokenError") {
                    res.status(401).json({
                        ...defaultResponse,
                        status: "ERROR",
                        code: "INVALID_TOKEN",
                        message: "Token is invalid"
                    }).end()
                    return;
                }
                if (userId !== decoded!.id) {
                    res.status(401).json({
                        ...defaultResponse,
                        status: "ERROR",
                        code: "INVALID_USER_TOKEN",
                        message: "Invalid token user"
                    }).end()
                    return;
                }
                req.id = decoded.id;
                req.name = decoded.name;
                next();
                return;
            })
        }else{
            res.status(401).json({
                ...defaultResponse,
                status: "ERROR",
                code: "UNAUTHORIZED"
            }).end()
        }
    } else {
        res.status(401).json({
            ...defaultResponse,
            status: "ERROR",
            code: "UNAUTHORIZED"
        }).end()
    }
}