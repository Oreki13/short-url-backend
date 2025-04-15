import { Request, Response } from 'express';
import { defaultResponse } from '../model/basic_response_model';

class ErrorController {
    static notFoundHandler = (req: Request, res: Response): void => {
        res.status(404).json({
            ...defaultResponse,
            status: "ERROR",
            code: "NOT_FOUND",
            message: "Resource not found",
        });
    }
}

export default ErrorController;