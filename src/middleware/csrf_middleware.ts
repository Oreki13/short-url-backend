import { Request, Response, NextFunction } from "express";
import { BasicResponse, defaultResponse } from "../model/basic_response_model";

/**
 * Middleware untuk menangani token CSRF
 * - Menyediakan token CSRF pada response header untuk API yang tidak memerlukan CSRF token
 * - Menyediakan endpoint khusus untuk klien untuk mendapatkan token CSRF
 */
export const csrfTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Menyediakan token CSRF pada header response
    const csrfToken = req.csrfToken ? req.csrfToken() : '';
    res.set('X-CSRF-Token', csrfToken);
    next();
};

/**
 * Controller untuk endpoint yang menyediakan token CSRF
 */
export const getCsrfToken = (req: Request, res: Response<BasicResponse>) => {
    const csrfToken = req.csrfToken ? req.csrfToken() : '';
    return res.status(200).json({
        ...defaultResponse,
        status: "OK",
        code: "CSRF_TOKEN_GENERATED",
        message: "CSRF token generated successfully",
        data: { csrfToken }
    });
};

/**
 * Middleware untuk mengecualikan rute tertentu dari persyaratan CSRF
 */
export const csrfExemptMiddleware = (req: Request, res: Response, next: NextFunction) => {
    req.csrfToken = () => '';
    next();
};