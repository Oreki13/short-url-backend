export type LoginRequest = {
    email: string,
    password: string,
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
}

export type HeaderAuthRequest = {
    authorization?: string,
    "x-control-user": string,
    cookies?: {
        accessToken?: string;
        refreshToken?: string;
        [key: string]: string | undefined;
    }
}

export interface RefreshTokenRequest {
    refresh_token?: string;
    cookies?: {
        accessToken?: string;
        refreshToken?: string;
        [key: string]: string | undefined;
    }
}

export interface TokenResponse {
    access_token: string;
    expires_in: number;
}

export interface RevokeTokenRequest {
    refresh_token?: string;
    cookies?: {
        accessToken?: string;
        refreshToken?: string;
        [key: string]: string | undefined;
    }
}

export const toLoginResponse = (accessToken: string, refreshToken: string, expiresIn: number): LoginResponse => {
    return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn
    }
}