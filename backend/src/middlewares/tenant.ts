import type { RequestHandler } from "express"
import { ForbiddenError, UnauthorizedError } from "../utils/http_error.ts"
import type { AuthenticatedUser } from "./authentication.ts"

/** Konteks tenant yang sudah diverifikasi, disimpan di `res.locals.tenant`. */
export type TenantContext = {
    organisasi_id: number
    organisasi_kode: string
}

/** Locals untuk handler yang butuh identitas pemanggil + tenant terverifikasi. */
export type TenantScopedLocal = { user: AuthenticatedUser; tenant: TenantContext }

export type RequireTenantOptions = {
    /**
     * Nama field berisi **kode organisasi** pada params/body/query.
     * Sengaja opt-in: di `/peserta` field `kode` berarti kode peserta, bukan
     * kode organisasi, jadi tidak boleh ikut dibandingkan otomatis.
     */
    kode?: string
}

const CLAIM_PARTS = ["params", "body", "query"] as const

/**
 * Ambil klaim milik request (bila ada) dari hasil `validate()`.
 * Nilai ini TIDAK dipakai sebagai sumber kebenaran — hanya untuk mendeteksi
 * ketidakcocokan dengan klaim token.
 */
const readClaim = (validated: unknown, field: string): unknown => {
    if (!validated || typeof validated !== "object") return undefined
    const parts = validated as Record<string, unknown>
    for (const part of CLAIM_PARTS) {
        const value = parts[part]
        if (!value || typeof value !== "object") continue
        const claim = (value as Record<string, unknown>)[field]
        if (claim !== undefined && claim !== null) return claim
    }
    return undefined
}

/**
 * Guard tenant.
 *
 * `organisasi_id` efektif SELALU diambil dari klaim token
 * (`res.locals.user.orgId`) lalu ditulis ke `res.locals.tenant`, sehingga
 * controller tidak perlu — dan tidak boleh — mempercayai path/body.
 *
 * Bila request tetap menyebut `organisasi_id` (atau kode organisasi, untuk
 * route yang dipasangi opsi `kode`) dan nilainya berbeda dari token,
 * permintaan ditolak 403, bukan diabaikan diam-diam. Tujuannya agar salah
 * kirim dari klien maupun percobaan lintas tenant terlihat jelas, alih-alih
 * "berhasil" dengan tenant yang berbeda dari yang dimaksud pemanggil.
 *
 * Pemasangan: SETELAH `authenticateJWT` dan SETELAH `validate(...)`, karena
 * klaim dibaca dari `res.locals.validated`.
 */
export const requireTenant = (options: RequireTenantOptions = {}): RequestHandler => {
    const { kode: kodeField } = options

    return (_req, res, next) => {
        const user = (res.locals as { user?: Partial<AuthenticatedUser> }).user
        const orgId = user?.orgId
        if (typeof orgId !== "number" || !Number.isInteger(orgId)) {
            throw new UnauthorizedError("Konteks tenant tidak tersedia pada token.", {
                code: "TENANT.CONTEXT_MISSING",
            })
        }

        const claimedId = readClaim(res.locals.validated, "organisasi_id")
        if (typeof claimedId === "number" && Number.isInteger(claimedId) && claimedId !== orgId) {
            throw new ForbiddenError("Akses lintas organisasi tidak diizinkan.", {
                code: "TENANT.MISMATCH",
            })
        }

        const orgKode = typeof user?.orgKode === "string" ? user.orgKode : ""
        if (kodeField) {
            // Route berbasis kode tidak bisa diverifikasi tanpa `orgKode` di
            // token, jadi token yang tidak membawanya ditolak lebih awal.
            if (orgKode === "") {
                throw new UnauthorizedError("Konteks tenant tidak tersedia pada token.", {
                    code: "TENANT.CONTEXT_MISSING",
                })
            }
            const claimedKode = readClaim(res.locals.validated, kodeField)
            if (typeof claimedKode === "string" && claimedKode !== orgKode) {
                throw new ForbiddenError("Akses lintas organisasi tidak diizinkan.", {
                    code: "TENANT.MISMATCH",
                })
            }
        }

        res.locals.tenant = {
            organisasi_id: orgId,
            organisasi_kode: orgKode,
        } satisfies TenantContext

        next()
    }
}
