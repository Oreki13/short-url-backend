import { Request } from 'express'

// Menambahkan definisi untuk CSRF token 
declare global {
    namespace Express {
        interface Request {
            csrfToken(): string;
        }
    }
}

export interface UserRequest extends Request {
    id: string,
    name: string,
}