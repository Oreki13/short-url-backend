type ApiResponse = {
    status: "OK" | "ERROR",
    code: string | null,
    message: string | null,
    data: any
}

const defaultResponse: ApiResponse = {
    status: "OK",
    code: null,
    message: null,
    data: null
}

export { defaultResponse };
export type { ApiResponse };
