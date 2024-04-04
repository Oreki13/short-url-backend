import {ErrorResponse} from "../model/basic_response_model";

export class ResponseError extends Error {
    constructor(public status: number, public code:string, public message: string) {
        super(code);
    }
}