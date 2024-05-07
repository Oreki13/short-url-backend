import {Response, NextFunction} from "express";
import {defaultResponse} from "../model/basic_response_model";
import {UserRequest} from "../type/user_request";
import {prismaClient} from "../application/database";

export const adminMiddleware = async (req: UserRequest, res: Response, next: NextFunction) => {
    if (req.id === undefined || req.name === undefined) {
        res.status(401).json({
            ...defaultResponse,
            status: "ERROR",
            code: "UNAUTHORIZED"
        }).end()
        return;
    }

    const findUser = await prismaClient.user.findUnique({
        select: {
            role: {
                select: {
                    name: true
                }
            }
        },
        where: {
            id: req.id,
            is_deleted: 0
        }
    })

    if (findUser === null) {
        res.status(401).json({
            ...defaultResponse,
            status: "ERROR",
            code: "UNAUTHORIZED",
            message: "User does not exist"
        }).end()
        return;
    }

    if (findUser.role.name !== "superAdmin" && findUser.role.name !== "admin") {
        res.status(401).json({
            ...defaultResponse,
            status: "ERROR",
            code: "UNAUTHORIZED",
            message: "Only admin can access this feature"
        }).end();
        return;
    }
    next();
}