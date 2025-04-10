import { HeaderAuthRequest, LoginRequest, LoginResponse, RefreshTokenRequest, RevokeTokenRequest, TokenResponse, toLoginResponse } from "../model/auth_model";
import { Validation } from "../validation/validation";
import { Auth_validation } from "../validation/auth_validation";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/response_error";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
import { BasicResponse, defaultResponse } from "../model/basic_response_model";

export class Auth_service {
    static async login(request: LoginRequest, ipAddress: string, userAgent: string): Promise<LoginResponse> {
        const loginRequest = Validation.validate(Auth_validation.LOGIN, request);
        const findUser = await prismaClient.user.findFirst({
            where: {
                email: loginRequest.email,
                is_deleted: 0,
            },
            select: {
                id: true,
                email: true,
                password: true,
                name: true,
            }
        })

        if (findUser == null) {
            throw new ResponseError(404, "INVALID_CREDENTIAL", "Credential is invalid")
        }

        const comparePassword = await bcrypt.compare(loginRequest.password, findUser.password!)

        if (!comparePassword) {
            throw new ResponseError(404, "INVALID_CREDENTIAL", "Credential is invalid");
        }

        const secret = process.env.SECRET_KEY
        const expiresIn = 60 * 130; // 130 minutes in seconds
        const generateToken = jwt.sign({ "name": findUser.name, "id": findUser.id }, secret!, { expiresIn: '130m' })

        // Generate refresh token
        const refreshToken = uuidv4();
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

        // Optional: Limit active sessions per user (e.g., max 5 sessions)
        const activeTokenCount = await prismaClient.token.count({
            where: {
                user_id: findUser.id,
                is_revoked: false,
                expires_at: {
                    gt: new Date()
                }
            }
        });

        if (activeTokenCount >= 5) {
            // Delete oldest token to make room for new one
            const oldestToken = await prismaClient.token.findFirst({
                where: {
                    user_id: findUser.id,
                    is_revoked: false
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });

            if (oldestToken) {
                await prismaClient.token.update({
                    where: { id: oldestToken.id },
                    data: { is_revoked: true }
                });
            }
        }

        // Store refresh token in database
        await prismaClient.token.create({
            data: {
                refresh_token: refreshToken,
                expires_at: refreshTokenExpiry,
                user_id: findUser.id,
                device_info: userAgent,
                ip_address: ipAddress
            }
        });

        return toLoginResponse(generateToken, refreshToken, expiresIn);
    }

    static async verify(request: HeaderAuthRequest): Promise<BasicResponse> {
        const headerRequest = Validation.validate(Auth_validation.TOKENHEADER, request)
        const secretKey = process.env.SECRET_KEY;
        const accessToken = headerRequest.authorization?.split('Bearer')[1].trim()
        jwt.verify(accessToken!, secretKey!, (err, decoded: any) => {

            if (err && err.name === "TokenExpiredError") throw new ResponseError(401, "TOKEN_EXPIRED", "Token has been expired")

            if (err && err.name === "JsonWebTokenError") throw new ResponseError(401, "INVALID_TOKEN", "Token is invalid")

            if (headerRequest["x-control-user"] !== decoded!.id) throw new ResponseError(401, "INVALID_USER_TOKEN", "Invalid token user")

        })

        return defaultResponse
    }

    static async refreshToken(request: RefreshTokenRequest): Promise<TokenResponse> {
        // Find the refresh token in database
        const token = await prismaClient.token.findFirst({
            where: {
                refresh_token: request.refresh_token,
                is_revoked: false,
                expires_at: {
                    gt: new Date() // Not expired
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!token) {
            throw new ResponseError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired");
        }

        // Generate new access token
        const secret = process.env.SECRET_KEY;
        const expiresIn = 60 * 130; // 130 minutes in seconds
        const accessToken = jwt.sign({ "name": token.user.name, "id": token.user.id }, secret!, { expiresIn: '130m' });

        return {
            access_token: accessToken,
            expires_in: expiresIn
        };
    }

    static async revokeToken(request: RevokeTokenRequest): Promise<BasicResponse> {
        // Revoke the refresh token
        const token = await prismaClient.token.findFirst({
            where: {
                refresh_token: request.refresh_token,
                is_revoked: false
            }
        });

        if (!token) {
            throw new ResponseError(404, "TOKEN_NOT_FOUND", "Refresh token not found");
        }

        await prismaClient.token.update({
            where: {
                id: token.id
            },
            data: {
                is_revoked: true
            }
        });

        return {
            ...defaultResponse,
            message: "Token revoked successfully"
        };
    }

    static async logout(userId: string): Promise<BasicResponse> {
        // Revoke all refresh tokens for the user
        await prismaClient.token.updateMany({
            where: {
                user_id: userId,
                is_revoked: false
            },
            data: {
                is_revoked: true
            }
        });

        return {
            ...defaultResponse,
            message: "Logged out successfully"
        };
    }

}