import { HeaderAuthRequest, LoginRequest, LoginResponse, toLoginResponse} from "../model/auth_model";
import {Validation} from "../validation/validation";
import {AuthValidation} from "../validation/auth-validation";
import {prismaClient} from "../application/database";
import {ResponseError} from "../error/response_error";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {BasicResponse, defaultResponse} from "../model/basic_response_model";

export class AuthService {
    static async login(request: LoginRequest): Promise<LoginResponse> {
        const loginRequest = Validation.validate(AuthValidation.LOGIN, request);
        const findUser = await prismaClient.user.findFirst({
            where: {email: loginRequest.email},
            select: {
                id: true,
                email: true,
                password: true,
                name: true,
            }
        })

        if (findUser == null) {
            throw new ResponseError(404, "USER_UNREGISTERED", "User not found")
        }

        const comparePassword = await bcrypt.compare(loginRequest.password, findUser.password!)

        if (!comparePassword) {
            throw new ResponseError(404, "WRONG_PASSWORD", "Credential is invalid");
        }

        const secret = process.env.SECRET_KEY
        const generateToken = jwt.sign({"name": findUser.name, "id": findUser.id}, secret!, {expiresIn: '130m'})

        return toLoginResponse(generateToken);
    }

    static async verify(request: HeaderAuthRequest): Promise<BasicResponse> {
        const headerRequest = Validation.validate(AuthValidation.TOKENHEADER, request)
        const secretKey = process.env.SECRET_KEY;
        const accessToken = headerRequest.authorization?.split('Bearer')[1].trim()
        jwt.verify(accessToken!, secretKey!, (err, decoded: any) => {

            if (err && err.name === "TokenExpiredError") throw new ResponseError(401, "TOKEN_EXPIRED", "Token has been expired")

            if (err && err.name === "JsonWebTokenError") throw new ResponseError(401, "INVALID_TOKEN", "Token is invalid")

            if (headerRequest["x-control-user"] !== decoded!.id) throw new ResponseError(401, "INVALID_USER_TOKEN", "Invalid token user")

        })

        return defaultResponse
    }

}