import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { BasicResponse, defaultResponse } from "../model/basic_response_model";
import { ResponseError } from "../error/response_error";
import { Sentry } from "../application/web";
import { formatZodErrors } from "../helper/zod_error_formater";
import { logger } from "../application/logger";



export const errorMiddleware = (error: Error, req: Request, res: Response<BasicResponse>, next: NextFunction) => {
    if (error instanceof ZodError) {
        const formattedErrors = formatZodErrors(error);

        return res.status(400).json({
            ...defaultResponse,
            status: "ERROR",
            code: "ERROR_VALIDATION",
            message: "Validation failed. Please check your input.",
            data: formattedErrors
        });
    }

    if (error instanceof ResponseError) {
        return res.status(error.status).json({
            ...defaultResponse,
            status: "ERROR",
            code: error.code,
            message: error.message
        });
    }


    if (error.message.toLowerCase().includes("csrf")) {
        return res.status(403).json({
            ...defaultResponse,
            status: "ERROR",
            code: "CSRF_ERROR",
            message: "CSRF token mismatch"
        });
    }

    Sentry.captureException(error);
    logger.error(error.message, {
        name: error.name,
        stack: error.stack
    });

    return res.status(500).json({
        ...defaultResponse,
        status: "ERROR",
        code: "INTERNAL_SERVER_ERROR"
    });
}