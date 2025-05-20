import { z, ZodType } from "zod";

const SORT = [
    'asc', 'desc'
] as const;

export class DomainValidation {
    static readonly GETALL: ZodType = z.object({
        page: z.string().max(3),
        limit: z.string().max(3),
        keyword: z.string().max(255).optional().default(""),
        sort: z.enum(SORT).optional().default("asc")
    })

    static readonly STORE: ZodType = z.object({
        domain: z.string()
            .min(1, "Please fill domain")
            .max(255, "Max Length 255")
            .url("Please input valid URL"),
        is_default: z.number()
            .int()
            .min(0)
            .max(1)
            .optional()
            .default(0)
    })

    static readonly DOMAIN_ID: ZodType = z.object({
        id: z.string()
            .min(1, "Please fill the id")
            .max(155, "Max Length 155")
    })

    static readonly SET_DEFAULT: ZodType = z.object({
        domain_id: z.string()
            .min(1, "Please fill the domain id")
            .max(155, "Max Length 155")
    })

    static readonly UPDATE: ZodType = z.object({
        domain: z.string()
            .max(255, "Max Length 255")
            .url("Please input valid URL")
            .optional(),
        is_default: z.number()
            .int()
            .min(0)
            .max(1)
            .optional()
    }).refine(({
        domain,
        is_default
    }) => domain !== undefined || is_default !== undefined,
        { message: "One of the fields must be defined" })
}
