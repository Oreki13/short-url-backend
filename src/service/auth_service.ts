import { HeaderAuthRequest, LoginRequest, LoginResponse, RefreshTokenRequest, RevokeTokenRequest, TokenResponse, toLoginResponse } from "../model/auth_model";
import { Validation } from "../validation/validation";
import { Auth_validation } from "../validation/auth_validation";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/response_error";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
import { BasicResponse, defaultResponse } from "../model/basic_response_model";
import { generateJwt } from "../helper/generate_jwt";
import { Request, Response } from 'express';

export class Auth_service {
    static async login(request: LoginRequest, ipAddress: string, userAgent: string, res: Response): Promise<LoginResponse> {
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

        const { access_token, expires_in } = generateJwt(findUser.name, findUser.id);

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

        // Set secure cookies
        this.setTokenCookies(res, access_token, refreshToken, expires_in);

        return toLoginResponse(access_token, refreshToken, expires_in);
    }

    static async verify(request: HeaderAuthRequest): Promise<BasicResponse> {
        const headerRequest = Validation.validate(Auth_validation.TOKENHEADER, request)
        const secretKey = process.env.SECRET_KEY;

        // Get token from Authorization header or from cookie
        let accessToken: string | undefined;

        if (headerRequest.authorization) {
            accessToken = headerRequest.authorization?.split('Bearer')[1].trim();
        } else if (headerRequest.cookies?.accessToken) {
            accessToken = headerRequest.cookies.accessToken;
        }

        if (!accessToken) {
            throw new ResponseError(401, "MISSING_TOKEN", "Access token is missing");
        }

        jwt.verify(accessToken, secretKey!, { algorithms: ['HS256'] }, (err, decoded: any) => {
            if (err && err.name === "TokenExpiredError") throw new ResponseError(401, "TOKEN_EXPIRED", "Token has been expired")

            if (err && err.name === "JsonWebTokenError") throw new ResponseError(401, "INVALID_TOKEN", "Token is invalid")

            if (headerRequest["x-control-user"] !== decoded!.id) throw new ResponseError(401, "INVALID_USER_TOKEN", "Invalid token user")
        })

        return defaultResponse
    }

    static async refreshToken(request: RefreshTokenRequest, res: Response): Promise<TokenResponse> {
        let refreshTokenValue = request.refresh_token;

        // Try to get refresh token from cookie if not in request body
        if (!refreshTokenValue && request.cookies?.refreshToken) {
            refreshTokenValue = request.cookies.refreshToken;
        }

        if (!refreshTokenValue) {
            throw new ResponseError(400, "MISSING_REFRESH_TOKEN", "Refresh token is required");
        }

        // Find the refresh token in database
        const token = await prismaClient.token.findFirst({
            where: {
                refresh_token: refreshTokenValue,
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
        const { access_token, expires_in } = generateJwt(token.user.name, token.user.id);

        // Set new cookies
        this.setTokenCookies(res, access_token, refreshTokenValue, expires_in);

        return {
            access_token,
            expires_in
        };
    }

    static async revokeToken(request: RevokeTokenRequest, res: Response): Promise<BasicResponse> {
        let refreshTokenValue = request.refresh_token;

        // Try to get refresh token from cookie if not in request body
        if (!refreshTokenValue && request.cookies?.refreshToken) {
            refreshTokenValue = request.cookies.refreshToken;
        }

        if (!refreshTokenValue) {
            throw new ResponseError(400, "MISSING_REFRESH_TOKEN", "Refresh token is required");
        }

        // Revoke the refresh token
        const token = await prismaClient.token.findFirst({
            where: {
                refresh_token: refreshTokenValue,
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

        // Clear cookies
        this.clearTokenCookies(res);

        return {
            ...defaultResponse,
            message: "Token revoked successfully"
        };
    }

    static async logout(userId: string, res: Response): Promise<BasicResponse> {
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

        // Clear cookies
        this.clearTokenCookies(res);

        return {
            ...defaultResponse,
            message: "Logged out successfully"
        };
    }

    // Helper methods for cookie management
    private static setTokenCookies(res: Response, accessToken: string, refreshToken: string, expiresIn: number): void {
        // Set access token cookie (short-lived)
        res.cookie('accessToken', accessToken, {
            httpOnly: true,                              // Tidak dapat diakses via JavaScript
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'strict',                          // Proteksi CSRF
            maxAge: expiresIn * 1000,                    // Konversi dari detik ke milidetik
            path: '/'
        });

        // Set refresh token cookie (long-lived)
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,            // 7 hari
            path: '/api/v1/auth'                         // Hanya tersedia di endpoint auth
        });
    }

    private static clearTokenCookies(res: Response): void {
        res.clearCookie('accessToken', { path: '/' });
        res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    }
}