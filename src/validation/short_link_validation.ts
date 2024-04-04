import {z, ZodType} from "zod";

export class ShortLinkValidation {
    static readonly GETALL: ZodType = z.object({
        page: z.number().max(3),
        limit: z.number().max(3),
    })

    static readonly STORE: ZodType = z.object({
        title: z.string().min(1, "Please fill title").max(255, "Max Length 255"),
        destination: z.string().min(1, "Please fill destination").max(355, "Max Length 355").url("Please input valid URL"),
        backHalf: z.string().min(1,"Please fill backhalf").max(255, "Max Length 255")
    })
}