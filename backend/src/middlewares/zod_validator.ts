import type { Request, RequestHandler, Response } from "express"
import type { ZodType } from "zod"

type RequestPart = "body" | "query" | "params"

export const validate = <TOutput>(schema: ZodType<TOutput>, part: RequestPart): RequestHandler => {
    return async (req: Request, res: Response, next) => {
        try {
            const parsed = await schema.parseAsync(req[part])
            const validated = (res.locals.validated ?? {}) as Partial<Record<RequestPart, unknown>>
            res.locals.validated = { ...validated, [part]: parsed }
            next()
        } catch (error) {
            next(error)
        }
    }
}
