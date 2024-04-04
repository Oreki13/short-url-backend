type BasicResponse = {
    status: "OK" | "ERROR",
    code: string | null,
    message: string | null,
    data: any
}

interface ErrorResponse {
    status: number,
    code: string | null,
    message: string | null,
    data: any
}

interface ErrorResponseConstructor {
    new(code?: string | null): ErrorResponse;

    ( code?: string | null): ErrorResponse;

    readonly prototype: ErrorResponse;
}

declare var ErrorResponse: ErrorResponseConstructor;


const defaultResponse: BasicResponse = {
    status: "OK",
    code: null,
    message: null,
    data: null
}

export {defaultResponse, ErrorResponse};
export type {BasicResponse};
