import {Request} from 'express'
export interface UserRequest extends Request {
    id: string,
    name: string,
}