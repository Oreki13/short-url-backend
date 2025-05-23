import { NextFunction, Request, Response } from "express";
import { BasicResponse, defaultResponse } from "../model/basic_response_model";
import { ShortLinkGetAllRequest, ShortLinkStoreRequest, ShortLinkUpdateRequest } from "../model/short_link_model";
import { ShortLinkServices } from "../service/short_link_service";
import { HeaderAuthRequest } from "../model/auth_model";

const ShortLinkController = {
    getAll: async (req: Request, res: Response<BasicResponse>, next: NextFunction) => {
        try {
            const request: ShortLinkGetAllRequest = req.query as unknown as ShortLinkGetAllRequest;
            const requestHeader: HeaderAuthRequest = {
                authorization: req.headers.authorization,
                "x-control-user": req.headers["x-control-user"] as string || "",
                cookies: req.cookies // Tambahkan cookies untuk verifikasi
            };
            const response = await ShortLinkServices.getAll(request, requestHeader);
            res.status(200).json({
                ...defaultResponse, code: "SUCCESS", data: response,
            });
        } catch (e) {
            next(e)
        }
    },
    store: async (req: Request, res: Response<BasicResponse>, next: NextFunction) => {
        try {
            const request: ShortLinkStoreRequest = req.body as ShortLinkStoreRequest;
            const requestHeader: HeaderAuthRequest = {
                authorization: req.headers.authorization,
                "x-control-user": req.headers["x-control-user"] as string || "",
                cookies: req.cookies // Tambahkan cookies untuk verifikasi
            };
            const response = await ShortLinkServices.store(request, requestHeader);

            res.status(200).json(response);
        } catch (e) {
            next(e)
        }
    },
    update: async (req: Request, res: Response<BasicResponse>, next: NextFunction) => {
        try {
            const request = req.body as ShortLinkUpdateRequest;
            const response = await ShortLinkServices.update(request, req.params.id);

            res.status(200).json(response);
        } catch (e) {
            next(e)
        }
    },
    delete: async (req: Request, res: Response<BasicResponse>, next: NextFunction) => {
        try {
            const request = req.params;
            const response = await ShortLinkServices.delete(request.id);

            res.status(200).json(response);
        } catch (e) {
            next(e);
        }
    }
}

export default ShortLinkController