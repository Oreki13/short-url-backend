import { z, ZodType } from "zod";

export class UserValidation {
    static readonly CREATEUSER: ZodType = z.object({
        name: z.string().min(1).max(255),
        email: z.string().min(1).max(255).email(),
        password: z.string().min(1).max(355),
        role_id: z.nullable(z.string().min(1).max(50)).optional(),
    })

    static readonly IDUSER: ZodType = z.object({
        id: z.string().min(1).max(50)
    })
}