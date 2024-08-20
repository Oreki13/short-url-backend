import {Request, Response, NextFunction} from "express";
import {ZodError} from "zod";
import {BasicResponse, defaultResponse} from "../model/basic_response_model";
import {ResponseError} from "../error/response_error";

export const errorMiddleware = (error: Error, req: Request, res: Response<BasicResponse>, next: NextFunction) => {
    if (error instanceof ZodError) {
        return res.status(400).json({
            ...defaultResponse,
            status: "ERROR",
            code: "ERROR_VALIDATION",
            message: error.message
        })
    }
    if (error instanceof ResponseError) {
        return res.status(error.status).json({
            ...defaultResponse,
            status: "ERROR",
            code: error.code,
            message: error.message
        });
    }

    return res.status(500).json({
        ...defaultResponse,
        status: "ERROR",
        code: "INTERNAL_SERVER_ERROR"
    })
}