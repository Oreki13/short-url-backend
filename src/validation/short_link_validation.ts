import {z, ZodType} from "zod";

const SORT = [
    'asc', 'desc'
] as const;

export class ShortLinkValidation {
    static readonly GETALL: ZodType = z.object({
        page: z.string().max(3),
        limit: z.string().max(3),
        keyword: z.string().max(255).optional().default(""),
        sort: z.enum(SORT).optional().default("asc")
    })

    static readonly STORE: ZodType = z.object({
        title: z.string().min(1, "Please fill title").max(255, "Max Length 255"),
        destination: z.string().min(1, "Please fill destination").max(355, "Max Length 355").url("Please input valid URL"),
        path: z.string().min(1, "Please fill path").max(255, "Max Length 255")
    })

    static readonly SHORTLINKID: ZodType = z.object({
        id: z.string().min(1, "Please fill the id").max(155, "Max Length 155")
    })

    static readonly UPDATE: ZodType = z.object({
        title: z.string().max(255, "Max Length 255").optional(),
        destination: z.string().max(355, "Max Length 355").url("Please input valid URL").optional(),
        path: z.string().max(255, "Max Length 255").optional()
    }).refine(({
                   title,
                   destination,
                   path
               }) => title !== undefined || destination !== undefined || path !== undefined,
        {message: "One of the fields must be defined"})
}