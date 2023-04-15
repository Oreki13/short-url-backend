import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken'
import { ApiResponse, defaultResponse } from "./type/api_response_struct";

const AuthHelper = {
    accessTokenCheck: (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
        const secretKey = process.env.SECRET_KEY;
        const accessTokenBearer = req.headers['authorization'];
        const userToken = req.headers["x-control-user"];
        if (accessTokenBearer !== null) {

            const accessToken = accessTokenBearer?.split('Bearer')[1].trim()
            jwt.verify(accessToken!, secretKey!, (err, decoded: any) => {

                if (err && err.name === "TokenExpiredError")
                    return res.status(200).json({ ...defaultResponse, status: 'ERROR', code: "TOKEN_EXPIRED" })

                if (err && err.name === "JsonWebTokenError")
                    return res.status(200).json({ ...defaultResponse, status: 'ERROR', code: "INVALID_TOKEN" })

                if (userToken !== decoded!.id)
                    return res.status(200).json({ ...defaultResponse, status: 'ERROR', code: "INVALID_USER_TOKEN" })

                next();
            })
        } else {
            return res.status(401).json({ ...defaultResponse, status: "ERROR", code: "UNAUTHORIZED" })
        }
    }
}

export default AuthHelper