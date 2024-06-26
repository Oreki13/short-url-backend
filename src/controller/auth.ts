import {NextFunction, Request, Response} from "express"
import {BasicResponse, defaultResponse} from "../model/basic_response_model"
import { HeaderAuthRequest, LoginRequest, LoginResponse} from "../model/auth_model";
import {Auth_service} from "../service/auth_service";

class AuthController {
    static async login(req: Request, res: Response<BasicResponse>, next: NextFunction) {
        try {
            const request: LoginRequest = req.body as LoginRequest
            const response: LoginResponse = await Auth_service.login(request)

            res.status(200).json({
                ...defaultResponse, code: "LOGIN_SUCCESS", data: response.token,
            })

        } catch (e) {
            next(e)
        }
    }
    static async verify(req: Request, res: Response<BasicResponse>, next: NextFunction){
        try {
            const request: HeaderAuthRequest = req.headers as HeaderAuthRequest
            const response: BasicResponse = await Auth_service.verify(request)

            res.status(200).json(response);
        }catch (e){
            next(e);
        }
    }

}

export default AuthController