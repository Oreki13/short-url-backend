import { Request, Response } from "express"
import { ApiResponse, defaultResponse } from "../helpers/type/api_response_struct"
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt';
import AuthModels from "../models/auth";

const AuthController = {
    login: async (req: Request, res: Response<ApiResponse>) => {
        if (req.method !== 'POST') {
            res.status(404).json({ ...defaultResponse, status: "ERROR", code: "INVALID_METHODE", message: "Methode not allowed!" })
            return
        }
        const email = req.body['email']
        const password = req.body['password']

        if (email === undefined) {
            res.status(200).json({ ...defaultResponse, status: 'ERROR', code: "REQUIRED_EMAIL" })
            return
        }
        if (password === undefined) {
            res.status(200).json({ ...defaultResponse, status: 'ERROR', code: "REQUIRED_PASSWORD" })
            return
        }
        const user = await AuthModels.login(email)

        if (user === null) {
            res.status(200).json({ ...defaultResponse, status: 'ERROR', code: "USER_UNREGISTERED", message: "User not found" })
            return
        }
        const comparePassword = await bcrypt.compare(password, user.password!)

        if (!comparePassword) {
            res.status(200).json({ ...defaultResponse, status: 'ERROR', code: "WRONG_PASSWORD" })
            return
        }
        const secret = process.env.SECRET_KEY
        const token = jwt.sign({ "name": user.name, "id": user.id }, secret!, { expiresIn: '130m' });
        res.status(200).json({ ...defaultResponse, data: { 'token': token } })
    },
    verify: (req: Request, res: Response<ApiResponse>) => {
        const secretKey = process.env.SECRET_KEY;
        const accessTokenBearer = req.headers['authorization'];
        const userToken = req.headers["x-control-user"];
        if (accessTokenBearer !== null) {
            const accessToken = accessTokenBearer?.split('Bearer')[1].trim()

            jwt.verify(accessToken!, secretKey!, (err, decoded: any) => {

                if (err && err.name === "TokenExpiredError")
                    return res.status(200).json({ ...defaultResponse, status: 'ERROR', code: "TOKEN_EXPIRED" })

                if (err && err.name === "JsonWebTokenError")
                    return res.status(200).json({ ...defaultResponse, status: 'ERROR', code: "INVALID_TOKEN" })

                if (userToken !== decoded!.id)
                    return res.status(200).json({ ...defaultResponse, status: 'ERROR', code: "INVALID_USER_TOKEN" })

                return res.status(200).json({ ...defaultResponse })
            })

        } else {
            return res.status(401).json({ ...defaultResponse, status: "ERROR", code: "UNAUTHORIZED" })
        }
    }
}

export default AuthController