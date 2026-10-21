import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { db } from "../prisma/db.ts"
import { UnauthorizedError, ForbiddenError, InternalServerError } from "../utils/http_error.ts"

/**
 * Middleware autentikasi JWT.
 *
 * Alur error (diseragamkan lewat `errorHandler`):
 *   - Header hilang / format salah   → 401 AUTH.MISSING_HEADER
 *   - Token kadaluarsa               → 401 AUTH.TOKEN_EXPIRED
 *   - Token tidak valid              → 401 AUTH.TOKEN_INVALID
 *   - Payload tidak lengkap          → 401 AUTH.TOKEN_MALFORMED
 *   - User tidak ada / nonaktif      → 401 AUTH.ACCOUNT_INACTIVE
 *   - Organisasi tidak ada / nonaktif→ 403 ORG.INACTIVE
 *   - Kegagalan DB / tak terduga     → mengalir ke errorHandler (503/500)
 *
 * Express 5 otomatis mem-propagate rejection dari async handler ke `next(err)`,
 * jadi kita lempar `HttpError` saja — tidak perlu `res.status(...).json(...)` manual,
 * sehingga envelope response konsisten dengan route lain.
 */
interface JwtPayload {
    userId: number
    orgKode: string
    orgId: number
    username: string
}

export const authenticateJWT = async (
    req: Request,
    res: Response,
    _next: NextFunction,
): Promise<void> => {
    // Semua error dari blok di bawah ini dilempar → Express 5 forward ke errorHandler.
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Token autentikasi tidak ditemukan.", {
            code: "AUTH.MISSING_HEADER",
        })
    }

    const token = authHeader.substring(7)
    let decoded: JwtPayload
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            throw new UnauthorizedError("Token telah kedaluwarsa.", {
                code: "AUTH.TOKEN_EXPIRED",
            })
        }
        if (err instanceof jwt.JsonWebTokenError) {
            throw new UnauthorizedError("Token tidak valid.", {
                code: "AUTH.TOKEN_INVALID",
            })
        }
        // jwt.verify seharusnya tidak melempar selain dua tipe di atas;
        // kalau lolos ke sini = bug konfigurasi (mis. secret hilang) → 500.
        throw new InternalServerError("Gagal memverifikasi token.", {
            code: "AUTH.VERIFY_FAILED",
            cause: err,
        })
    }

    if (!decoded || typeof decoded.userId !== "number" || typeof decoded.orgId !== "number") {
        throw new UnauthorizedError("Payload token tidak lengkap.", {
            code: "AUTH.TOKEN_MALFORMED",
        })
    }

    // Cek existensi + isActive user & organisasi — DB error (mis. SqlConnectionError)
    // sengaja TIDAK di-catch di sini; biar errorHandler yang memetakan ke 503.
    const findUser = await db.orm.public.user.where({ id: decoded.userId }).first()
    if (!findUser || !findUser.isActive) {
        throw new UnauthorizedError("Akun tidak ditemukan atau sudah dinonaktifkan.", {
            code: "AUTH.ACCOUNT_INACTIVE",
        })
    }

    const findOrg = await db.orm.public.organisasi.where({ id: decoded.orgId }).first()
    if (!findOrg || !findOrg.isActive) {
        throw new ForbiddenError("Organisasi tidak ditemukan atau sudah dinonaktifkan.", {
            code: "ORG.INACTIVE",
        })
    }

    res.locals.user = decoded
    _next()
}
