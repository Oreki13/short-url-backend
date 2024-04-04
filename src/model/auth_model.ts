export type LoginRequest = {
    email: string,
    password: string,
}

export type LoginResponse = {
    token: string,
}

export type HeaderAuthRequest = {
    authorization: string,
    "x-control-user": string,
}

export const toLoginResponse = (token: string): LoginResponse => {
    return {token}
}