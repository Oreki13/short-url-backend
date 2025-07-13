import jwt from "jsonwebtoken";
import { TokenResponse } from "../model/auth_model";

export const generateJwt = (name: string, id: string): TokenResponse => {
    const secret = process.env.SECRET_KEY;
    // const expiresIn = 5; // 130 minutes in seconds
    const expiresIn = 60 * 130; // 130 minutes in seconds
    const jwtString = jwt.sign({ name, id }, secret!, { expiresIn: '130m' });
    return {
        access_token: jwtString,
        expires_in: expiresIn
    }
}