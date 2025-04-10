import { z, ZodType } from "zod";

export class Auth_validation {
    static readonly LOGIN: ZodType = z.object({
        email: z.string().email().min(1).max(100),
        password: z.string().min(1).max(255)
    })
    static readonly TOKENHEADER: ZodType = z.object({
        authorization: z.string().min(1).max(350),
        "x-control-user": z.string().min(1).max(350),
    })

    static readonly REFRESH_TOKEN = z.object({
        refresh_token: z.string().min(1)
    });

    static readonly REVOKE_TOKEN = z.object({
        refresh_token: z.string().min(1)
    });
}