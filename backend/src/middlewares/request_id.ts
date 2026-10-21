/**
 * Request-ID middleware.
 *
 * Menempelkan `requestId` (UUID v4) ke `req`, `res.locals`, dan response header
 * `X-Request-Id`. Nilai ini dipakai:
 *  - errorHandler → include `requestId` ke body 5xx agar klien bisa quoting saat lapor bug;
 *  - log server → korelasi stack-trace dengan HTTP access log (morgan).
 *
 * Jika upstream (mis. reverse-proxy / API gateway) sudah mengirim `X-Request-Id`,
 * nilai itu dipakai ulang agar trace utuh lintas hop.
 */
import type { Request, Response, NextFunction } from "express"
import { randomUUID } from "node:crypto"

export const REQUEST_ID_HEADER = "X-Request-Id"

declare module "express" {
    interface Request {
        requestId?: string
    }
}

export const requestId = (req: Request, res: Response, next: NextFunction): void => {
    const incoming = req.headers[REQUEST_ID_HEADER.toLowerCase()]
    const candidate = Array.isArray(incoming) ? incoming[0] : incoming
    const id =
        typeof candidate === "string" && candidate.length > 0 && candidate.length <= 128
            ? candidate
            : randomUUID()

    req.requestId = id
    res.locals.requestId = id
    res.setHeader(REQUEST_ID_HEADER, id)
    next()
}
