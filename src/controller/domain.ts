import { NextFunction, Request, Response } from "express";
import { BasicResponse, defaultResponse } from "../model/basic_response_model";
import { DomainGetAllRequest, DomainSetDefaultRequest, DomainStoreRequest, DomainUpdateRequest } from "../model/domain_model";
import { DomainServices } from "../service/domain_service";
import { HeaderAuthRequest } from "../model/auth_model";

const DomainController = {
    getAll: async (req: Request, res: Response<BasicResponse>, next: NextFunction) => {
        try {
            const request: DomainGetAllRequest = req.query as unknown as DomainGetAllRequest;
            const requestHeader: HeaderAuthRequest = {
                authorization: req.headers.authorization,
                "x-control-user": req.headers["x-control-user"] as string || "",
                cookies: req.cookies
            };
            const response = await DomainServices.getAll(request, requestHeader);
            res.status(200).json({
                ...defaultResponse, code: "SUCCESS", data: response,
            });
        } catch (e) {
            next(e)
        }
    },

    store: async (req: Request, res: Response<BasicResponse>, next: NextFunction) => {
        try {
            const request: DomainStoreRequest = req.body as DomainStoreRequest;
            const requestHeader: HeaderAuthRequest = {
                authorization: req.headers.authorization,
                "x-control-user": req.headers["x-control-user"] as string || "",
                cookies: req.cookies
            };
            const response = await DomainServices.store(request, requestHeader);

            res.status(200).json(response);
        } catch (e) {
            next(e)
        }
    },

    update: async (req: Request, res: Response<BasicResponse>, next: NextFunction) => {
        try {
            const request = req.body as DomainUpdateRequest;
            const response = await DomainServices.update(request, req.params.id);

            res.status(200).json(response);
        } catch (e) {
            next(e)
        }
    },

    delete: async (req: Request, res: Response<BasicResponse>, next: NextFunction) => {
        try {
            const request = req.params;
            const response = await DomainServices.delete(request.id);

            res.status(200).json(response);
        } catch (e) {
            next(e);
        }
    },

    setDefault: async (req: Request, res: Response<BasicResponse>, next: NextFunction) => {
        try {
            const request: DomainSetDefaultRequest = req.body as DomainSetDefaultRequest;
            const requestHeader: HeaderAuthRequest = {
                authorization: req.headers.authorization,
                "x-control-user": req.headers["x-control-user"] as string || "",
                cookies: req.cookies
            };
            const response = await DomainServices.setDefault(request, requestHeader);

            res.status(200).json(response);
        } catch (e) {
            next(e)
        }
    }
}

export default DomainController;
