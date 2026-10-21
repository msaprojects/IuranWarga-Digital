import type { ErrorRequestHandler, Response } from "express"
import { ZodError } from "zod"
import { HttpError } from "./http_error.ts"

type SuccessResponse<TData> = {
    status: "success"
    message: string
    data: TData
}

type ErrorEnvelope = {
    status: "failed"
    message: string
    errors?: unknown
    code?: string
    requestId?: string
}

class ResponseHandler {
    success<TData>(res: Response, statusCode: number, message: string, data: TData): void {
        res.status(statusCode).json({
            status: "success",
            message,
            data,
        } satisfies SuccessResponse<TData>)
    }

    error(res: Response, statusCode: number, message: string, errors?: unknown): void {
        const body: ErrorEnvelope = { status: "failed", message }
        if (errors !== undefined) {
            body.errors = errors
        }
        res.status(statusCode).json(body)
    }

    /**
     * Varian `error` yang menyertakan machine-readable `code` dan `requestId`.
     * Dipakai oleh `errorHandler` untuk 5xx (dan 4xx tertentu dari Prisma).
     */
    errorWith(
        res: Response,
        statusCode: number,
        message: string,
        extra?: { code?: string; errors?: unknown; requestId?: string },
    ): void {
        const body: ErrorEnvelope = { status: "failed", message }
        if (extra?.errors !== undefined) body.errors = extra.errors
        if (extra?.code !== undefined) body.code = extra.code
        if (extra?.requestId !== undefined) body.requestId = extra.requestId
        res.status(statusCode).json(body)
    }
}

export const resHandler = new ResponseHandler()

// ---------- Prisma 8 error duck-typing ----------
//
// Prisma 8 (`@prisma/orm-family-sql/errors`) mengekspor:
//   - SqlQueryError      { kind: "sql_query",      sqlState, constraint, table, column, detail }
//   - SqlConnectionError { kind: "sql_connection", transient }
//   - UNIQUE_VIOLATION_SQLSTATE = "23505"
//
// Kita sengaja tidak `import` langsung dari paket itu (transitive dep), agar:
//   1) aplikasi tidak perlu menambahkan dependency baru;
//   2) tetap kompatibel bila Prisma mengubah module-export path;
//   3) unit-test bisa membuat fake error dengan bentuk struktural yang sama.
interface SqlQueryErrorLike extends Error {
    kind: "sql_query"
    sqlState?: string
    constraint?: string
    table?: string
    column?: string
    detail?: string
}
interface SqlConnectionErrorLike extends Error {
    kind: "sql_connection"
    transient?: boolean
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null

const isSqlQueryError = (err: unknown): err is SqlQueryErrorLike =>
    isObject(err) && (err as { kind?: unknown }).kind === "sql_query"

const isSqlConnectionError = (err: unknown): err is SqlConnectionErrorLike =>
    isObject(err) && (err as { kind?: unknown }).kind === "sql_connection"

// SQLSTATE family yang dikenali PostgreSQL.
const SQLSTATE = {
    UNIQUE_VIOLATION: "23505",
    FOREIGN_KEY_VIOLATION: "23503",
    NOT_NULL_VIOLATION: "23502",
    CHECK_VIOLATION: "23514",
    EXCLUSION_VIOLATION: "23P01",
    SERIALIZATION_FAILURE: "40001",
    DEADLOCK_DETECTED: "40P01",
    TOO_MANY_CONNECTIONS: "53300",
    CON_LIMIT_EXCEEDED: "53400",
    ADMIN_SHUTDOWN: "57P01",
    CRASH_SHUTDOWN: "57P02",
    CANNOT_CONNECT_NOW: "57P03",
    QUERY_CANCELED: "57014",
    SYNTAX_ERROR: "42601",
    undefined_TABLE: "42P01",
    undefined_COLUMN: "42703",
    DATA_EXCEPTION: "22000",
} as const

/**
 * Memetakan satu `SqlQueryError` menjadi status HTTP + pesan Indonesia yang
 * spesifik + `errors[]` aman (tanpa nilai kolom asli, hanya nama tabel/kolom).
 */
const classifySqlQueryError = (
    err: SqlQueryErrorLike,
): {
    status: number
    message: string
    code: string
    errors?: unknown
    retryable?: boolean
} => {
    const state = err.sqlState
    // Bangun hint table/column tanpa membocorkan value.
    const hints: string[] = []
    if (err.table) hints.push(`tabel \`${err.table}\``)
    if (err.column) hints.push(`kolom \`${err.column}\``)
    const hint = hints.length ? ` (${hints.join(" pada ")})` : ""

    switch (state) {
        case SQLSTATE.UNIQUE_VIOLATION:
            return {
                status: 409,
                message: `Data dengan nilai unik sudah terdaftar${hint}.`,
                code: "DB.UNIQUE_VIOLATION",
                errors: { constraint: err.constraint, table: err.table, column: err.column },
            }
        case SQLSTATE.FOREIGN_KEY_VIOLATION:
            return {
                status: 400,
                message: `Referensi data tidak valid${hint}.`,
                code: "DB.FOREIGN_KEY_VIOLATION",
                errors: { constraint: err.constraint, table: err.table, column: err.column },
            }
        case SQLSTATE.NOT_NULL_VIOLATION:
            return {
                status: 400,
                message: `Kolom wajib belum terisi${hint}.`,
                code: "DB.NOT_NULL_VIOLATION",
                errors: { table: err.table, column: err.column },
            }
        case SQLSTATE.CHECK_VIOLATION:
            return {
                status: 400,
                message: `Nilai tidak memenuhi aturan pemeriksaan${hint}.`,
                code: "DB.CHECK_VIOLATION",
                errors: { constraint: err.constraint, table: err.table, column: err.column },
            }
        case SQLSTATE.EXCLUSION_VIOLATION:
            return {
                status: 409,
                message: `Bertabrakan dengan data yang sudah ada${hint}.`,
                code: "DB.EXCLUSION_VIOLATION",
                errors: { constraint: err.constraint, table: err.table, column: err.column },
            }
        case SQLSTATE.SERIALIZATION_FAILURE:
        case SQLSTATE.DEADLOCK_DETECTED:
            return {
                status: 409,
                message: "Transaksi dibatalkan karena konflik konkurensi. Silakan coba lagi.",
                code: "DB.SERIALIZATION_CONFLICT",
                retryable: true,
            }
        case SQLSTATE.TOO_MANY_CONNECTIONS:
        case SQLSTATE.CON_LIMIT_EXCEEDED:
            return {
                status: 503,
                message: "Kapasitas koneksi database penuh. Coba lagi beberapa saat.",
                code: "DB.TOO_MANY_CONNECTIONS",
                retryable: true,
            }
        case SQLSTATE.ADMIN_SHUTDOWN:
        case SQLSTATE.CRASH_SHUTDOWN:
        case SQLSTATE.CANNOT_CONNECT_NOW:
            return {
                status: 503,
                message: "Database sedang tidak menerima koneksi. Coba lagi nanti.",
                code: "DB.UNAVAILABLE",
                retryable: true,
            }
        case SQLSTATE.QUERY_CANCELED:
            return {
                status: 504,
                message: "Kueri dibatalkan karena melebihi batas waktu.",
                code: "DB.QUERY_CANCELED",
                retryable: true,
            }
        case SQLSTATE.SYNTAX_ERROR:
        case SQLSTATE.undefined_TABLE:
        case SQLSTATE.undefined_COLUMN:
            // Kesalahan di sisi aplikasi (bukan klien) → 500 + log keras.
            return {
                status: 500,
                message: "Terjadi kesalahan pada server.",
                code: "DB.SCHEMA_ERROR",
            }
        default:
            if (typeof state === "string" && state.startsWith("22")) {
                // Class 22 = data_exception → biasanya casting/encoding salah.
                return {
                    status: 400,
                    message: `Data tidak dapat diproses database${hint}.`,
                    code: "DB.DATA_EXCEPTION",
                    errors: { sqlState: state, table: err.table, column: err.column },
                }
            }
            return {
                status: 500,
                message: "Terjadi kesalahan pada server.",
                code: "DB.QUERY_ERROR",
            }
    }
}

/**
 * Body-parse error dari `express.json()`: `SyntaxError` dengan `status = 400`
 * dan `type = "entity.parse.failed"` (atau `"entity.too.large"` untuk overflow).
 */
const classifyBodyParseError = (
    err: unknown,
): { status: number; message: string; code: string } | null => {
    if (!isObject(err)) return null
    const type = (err as { type?: unknown }).type
    const status = (err as { status?: unknown }).status
    if (type === "entity.parse.failed") {
        return {
            status: 400,
            message: "Body permintaan bukan JSON yang valid.",
            code: "CLIENT.JSON_PARSE",
        }
    }
    if (type === "entity.too.large" || status === 413) {
        return {
            status: 413,
            message: "Ukuran permintaan melebihi batas.",
            code: "CLIENT.PAYLOAD_TOO_LARGE",
        }
    }
    if (type === "encoding.unsupported" || status === 415) {
        return {
            status: 415,
            message: "Content-Type tidak didukung.",
            code: "CLIENT.UNSUPPORTED_MEDIA",
        }
    }
    return null
}

// Log 5xx ke stdout dengan requestId + name + sqlState — TIDAK memuat
// stack/value kolom (mengurangi risiko PII).
const safeLogServer = (requestId: string | undefined, err: unknown): void => {
    const anyErr = err as { name?: string; message?: string; sqlState?: string; code?: string }
    const payload = {
        level: "error",
        requestId,
        errorName: anyErr?.name ?? typeof err,
        errorMessage: anyErr?.message ?? String(err),
        sqlState: anyErr?.sqlState,
        code: anyErr?.code,
    }

    console.error(JSON.stringify(payload))
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
    // `res.locals` di Express selalu terisi — tapi jika handler dipanggil dalam
    // konteks unit-test tanpa middleware stack, jaga agar tidak NPE.
    const requestId = (res?.locals as { requestId?: string } | undefined)?.requestId

    // 1. Zod → 400 dengan breakdown field.
    if (error instanceof ZodError) {
        resHandler.error(
            res,
            400,
            "Validation Error",
            error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
                code: issue.code,
            })),
        )
        return
    }

    // 2. Body-parse error dari express.json / body-parser.
    const bodyErr = classifyBodyParseError(error)
    if (bodyErr) {
        resHandler.error(res, bodyErr.status, bodyErr.message)
        return
    }

    // 3. HttpError (termasuk subclass: NotFoundError, ConflictError, dst.).
    if (error instanceof HttpError) {
        // 5xx → sertakan code & requestId. 4xx → tetap envelope lama (backward-compat).
        if (error.statusCode >= 500) {
            safeLogServer(requestId, error)
            resHandler.errorWith(res, error.statusCode, error.message, {
                code: error.code,
                errors: error.details,
                requestId,
            })
        } else {
            resHandler.error(res, error.statusCode, error.message, error.details)
        }
        return
    }

    // 4. Prisma 8 SqlConnectionError → 503 (database tidak bisa dihubungi / connection lepas).
    if (isSqlConnectionError(error)) {
        safeLogServer(requestId, error)
        const retryable = error.transient !== false
        resHandler.errorWith(
            res,
            503,
            retryable
                ? "Koneksi ke database terputus sementara. Silakan coba lagi."
                : "Koneksi ke database tidak tersedia.",
            {
                code: "DB.CONNECTION_CLOSED",
                errors: { transient: error.transient ?? true },
                requestId,
            },
        )
        return
    }

    // 5. Prisma 8 SqlQueryError → mapping per SQLSTATE.
    if (isSqlQueryError(error)) {
        const mapped = classifySqlQueryError(error)
        if (mapped.status >= 500) safeLogServer(requestId, error)
        resHandler.errorWith(res, mapped.status, mapped.message, {
            code: mapped.code,
            errors: mapped.errors,
            requestId: mapped.status >= 500 ? requestId : undefined,
        })
        return
    }

    // 6. Node.js fs errors yang lolos ke rantai request (mis. ENOENT dari download).
    if (isObject(error)) {
        const code = (error as { code?: unknown }).code
        if (typeof code === "string" && code.startsWith("E")) {
            switch (code) {
                case "ENOENT":
                    resHandler.error(res, 404, "Berkas tidak ditemukan di server.")
                    return
                case "EACCES":
                case "EPERM":
                    safeLogServer(requestId, error)
                    resHandler.errorWith(res, 500, "Terjadi kesalahan pada server.", {
                        code: "FS.PERMISSION_DENIED",
                        requestId,
                    })
                    return
                case "EMFILE":
                case "ENFILE":
                    safeLogServer(requestId, error)
                    resHandler.errorWith(
                        res,
                        503,
                        "Server kehabisan berkas/sumber daya untuk membuka file.",
                        {
                            code: "FS.RESOURCE_EXHAUSTED",
                            requestId,
                        },
                    )
                    return
            }
        }
    }

    // 7. Fallback → 500 dengan requestId agar ops bisa tracing, tanpa membocorkan detail.
    safeLogServer(requestId, error)
    resHandler.errorWith(res, 500, "Terjadi kesalahan pada server.", {
        code: "INTERNAL.UNEXPECTED",
        requestId,
    })
}
