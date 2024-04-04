import {NextFunction, Request, Response} from "express";
import {BasicResponse, defaultResponse} from "../model/basic_response_model";
import {ShortLinkGetAllRequest, ShortLinkStoreRequest} from "../model/short_link_model";
import {ShortLinkServices} from "../service/short_link_services";
import {HeaderAuthRequest} from "../model/auth_model";

const ShortLinkController = {
    getAll: async (req: Request, res: Response<BasicResponse>, next: NextFunction) => {
        try {
            const request: ShortLinkGetAllRequest = req.query as unknown as ShortLinkGetAllRequest;
            const requestHeader: HeaderAuthRequest = req.headers as HeaderAuthRequest;
            const response = ShortLinkServices.getAll(request, requestHeader);

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
            const requestHeader: HeaderAuthRequest = req.headers as HeaderAuthRequest;
            const response = await ShortLinkServices.store(request, requestHeader);

            res.status(200).json(response);
        }catch (e) {
            next(e)
        }
    },
}

export default ShortLinkController