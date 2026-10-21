/**
 * Unit test untuk `errorHandler` — memastikan setiap kelas error dipetakan ke
 * status + machine-code + pesan Indonesia yang tidak ambigu.
 *
 * Kenapa unit (bukan integration supertest):
 *   - Kami ingin memicu error spesifik (mis. SqlQueryError dengan sqlState 23505)
 *     tanpa harus menyiapkan DB constraint nyata.
 *   - Prisma 8 `SqlQueryError` di-duck-type via `{kind:"sql_query", sqlState}`;
 *     kita bangun fixture struktural dengan bentuk yang sama.
 */
import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals"
import type { Request, Response } from "express"
import { z } from "zod"
import { errorHandler } from "../src/utils/response_handler.ts"
import {
    BadRequestError,
    ConflictError,
    HttpError,
    NotFoundError,
    ServiceUnavailableError,
} from "../src/utils/http_error.ts"

// ---------- helpers: mock res/req ----------
interface MockResWrap {
    /** response object yang diberikan ke errorHandler */
    readonly res: Response
    /** statusCode terakhir yang diset via res.status() */
    statusCode(): number
    /** body terakhir yang dikirim via res.json() */
    body(): Record<string, unknown>
}

const makeRes = (): MockResWrap => {
    let statusCode = 0
    let body: Record<string, unknown> = {}
    const mock = {
        locals: { requestId: "req-abc-123" },
        status(code: number) {
            statusCode = code
            return mock
        },
        json(payload: Record<string, unknown>) {
            body = payload
            return mock
        },
    }
    return {
        res: mock as unknown as Response,
        statusCode: () => statusCode,
        body: () => body,
    }
}

const makeReq = (): Request => ({}) as Request

// Fixture struktural untuk Prisma 8 errors — lihat node_modules/@prisma/orm-family-sql/dist/errors.d.mts
const sqlQueryError = (init: {
    message?: string
    sqlState: string
    constraint?: string
    table?: string
    column?: string
    detail?: string
}) =>
    Object.assign(new Error(init.message ?? "sql error"), {
        name: "SqlQueryError",
        kind: "sql_query" as const,
        sqlState: init.sqlState,
        constraint: init.constraint,
        table: init.table,
        column: init.column,
        detail: init.detail,
    })

const sqlConnectionError = (init: { message?: string; transient?: boolean } = {}) =>
    Object.assign(new Error(init.message ?? "connection closed"), {
        name: "SqlConnectionError",
        kind: "sql_connection" as const,
        transient: init.transient,
    })

// ---------- tests ----------
describe("errorHandler", () => {
    let consoleErrorSpy: jest.SpyInstance
    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined)
    })
    afterEach(() => consoleErrorSpy.mockRestore())

    it("memetakan ZodError ke 400 dengan breakdown field", () => {
        const schema = z.strictObject({ nama: z.string().min(3) })
        const parsed = schema.safeParse({ nama: "x" })
        if (parsed.success) throw new Error("test fixture must fail parse")
        const wrap = makeRes()
        errorHandler(parsed.error, makeReq(), wrap.res, jest.fn())

        expect(wrap.statusCode()).toBe(400)
        const body = wrap.body()
        expect(body.status).toBe("failed")
        expect(body.message).toBe("Validation Error")
        const errs = body.errors as Array<{ field: string; message: string }>
        expect(errs[0]).toEqual(expect.objectContaining({ field: "nama" }))
    })

    it("meneruskan HttpError biasa apa adanya (backward compat)", () => {
        const wrap = makeRes()
        const err = new HttpError(418, "Penyeduh kopi menolak perintah.")
        errorHandler(err, makeReq(), wrap.res, jest.fn())
        expect(wrap.statusCode()).toBe(418)
        expect(wrap.body()).toEqual({
            status: "failed",
            message: "Penyeduh kopi menolak perintah.",
        })
    })

    it("subclass NotFoundError → 404 tanpa code di body (4xx envelope lama)", () => {
        const wrap = makeRes()
        errorHandler(new NotFoundError("Peserta tidak ditemukan."), makeReq(), wrap.res, jest.fn())
        expect(wrap.statusCode()).toBe(404)
        expect(wrap.body()).toEqual({ status: "failed", message: "Peserta tidak ditemukan." })
    })

    it("subclass ConflictError → 409", () => {
        const wrap = makeRes()
        errorHandler(new ConflictError("QR sudah digunakan."), makeReq(), wrap.res, jest.fn())
        expect(wrap.statusCode()).toBe(409)
    })

    it("5xx HttpError → body menyertakan code + requestId", () => {
        const wrap = makeRes()
        errorHandler(new ServiceUnavailableError(), makeReq(), wrap.res, jest.fn())
        expect(wrap.statusCode()).toBe(503)
        expect(wrap.body()).toEqual(
            expect.objectContaining({
                status: "failed",
                message: "Layanan sementara tidak tersedia.",
                code: "UPSTREAM.SERVICE_UNAVAILABLE",
                requestId: "req-abc-123",
            }),
        )
    })

    it("Prisma 8 SqlConnectionError → 503 DB.CONNECTION_CLOSED", () => {
        const wrap = makeRes()
        errorHandler(sqlConnectionError({ transient: true }), makeReq(), wrap.res, jest.fn())
        expect(wrap.statusCode()).toBe(503)
        const body = wrap.body()
        expect(body.code).toBe("DB.CONNECTION_CLOSED")
        expect(body.message).toContain("database")
        expect(body.requestId).toBe("req-abc-123")
    })

    it("Prisma 8 SqlQueryError UNIQUE (23505) → 409 DB.UNIQUE_VIOLATION + breakdown field", () => {
        const wrap = makeRes()
        errorHandler(
            sqlQueryError({
                sqlState: "23505",
                table: "user",
                column: "email",
                constraint: "user_email_key",
            }),
            makeReq(),
            wrap.res,
            jest.fn(),
        )
        expect(wrap.statusCode()).toBe(409)
        const body = wrap.body()
        expect(body.code).toBe("DB.UNIQUE_VIOLATION")
        // Pesan menyebut tabel/kolom tapi BUKAN value → tidak ada PII bocor.
        expect(body.message).toContain("tabel `user`")
        expect(body.message).toContain("kolom `email`")
        expect(JSON.stringify(body)).not.toContain("budi@example.com")
    })

    it("Prisma 8 SqlQueryError FK (23503) → 400 DB.FOREIGN_KEY_VIOLATION", () => {
        const wrap = makeRes()
        errorHandler(
            sqlQueryError({
                sqlState: "23503",
                table: "peserta",
                column: "user_id",
                constraint: "fk_user",
            }),
            makeReq(),
            wrap.res,
            jest.fn(),
        )
        expect(wrap.statusCode()).toBe(400)
        expect(wrap.body().code).toBe("DB.FOREIGN_KEY_VIOLATION")
    })

    it("Prisma 8 SqlQueryError NOT NULL (23502) → 400", () => {
        const wrap = makeRes()
        errorHandler(
            sqlQueryError({ sqlState: "23502", table: "peserta", column: "nama" }),
            makeReq(),
            wrap.res,
            jest.fn(),
        )
        expect(wrap.statusCode()).toBe(400)
        expect(wrap.body().code).toBe("DB.NOT_NULL_VIOLATION")
    })

    it("Prisma 8 SqlQueryError CHECK (23514) → 400", () => {
        const wrap = makeRes()
        errorHandler(
            sqlQueryError({ sqlState: "23514", constraint: "chk_nominal" }),
            makeReq(),
            wrap.res,
            jest.fn(),
        )
        expect(wrap.statusCode()).toBe(400)
        expect(wrap.body().code).toBe("DB.CHECK_VIOLATION")
    })

    it("Prisma 8 SqlQueryError DEADLOCK (40P01) → 409 retryable", () => {
        const wrap = makeRes()
        errorHandler(sqlQueryError({ sqlState: "40P01" }), makeReq(), wrap.res, jest.fn())
        expect(wrap.statusCode()).toBe(409)
        expect(wrap.body().code).toBe("DB.SERIALIZATION_CONFLICT")
    })

    it("Prisma 8 SqlQueryError TOO_MANY_CONNECTIONS (53300) → 503", () => {
        const wrap = makeRes()
        errorHandler(sqlQueryError({ sqlState: "53300" }), makeReq(), wrap.res, jest.fn())
        expect(wrap.statusCode()).toBe(503)
        expect(wrap.body().code).toBe("DB.TOO_MANY_CONNECTIONS")
    })

    it("Prisma 8 SqlQueryError SYNTAX (42601) → 500 DB.SCHEMA_ERROR + log", () => {
        const wrap = makeRes()
        errorHandler(sqlQueryError({ sqlState: "42601" }), makeReq(), wrap.res, jest.fn())
        expect(wrap.statusCode()).toBe(500)
        expect(wrap.body().code).toBe("DB.SCHEMA_ERROR")
        expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it("Prisma 8 SqlQueryError kelas 22 data-exception → 400 DB.DATA_EXCEPTION", () => {
        const wrap = makeRes()
        errorHandler(
            sqlQueryError({ sqlState: "22001", column: "kode" }),
            makeReq(),
            wrap.res,
            jest.fn(),
        )
        expect(wrap.statusCode()).toBe(400)
        expect(wrap.body().code).toBe("DB.DATA_EXCEPTION")
    })

    it("Prisma 8 SqlQueryError tak terkenali → 500 DB.QUERY_ERROR (tanpa detail)", () => {
        const wrap = makeRes()
        errorHandler(sqlQueryError({ sqlState: "99999" }), makeReq(), wrap.res, jest.fn())
        expect(wrap.statusCode()).toBe(500)
        expect(wrap.body().code).toBe("DB.QUERY_ERROR")
    })

    it("Body JSON rusak (express.json) → 400 CLIENT.JSON_PARSE", () => {
        const wrap = makeRes()
        const err = Object.assign(new SyntaxError("Unexpected token"), {
            type: "entity.parse.failed",
            status: 400,
            statusCode: 400,
        })
        errorHandler(err, makeReq(), wrap.res, jest.fn())
        expect(wrap.statusCode()).toBe(400)
        expect(wrap.body().message).toBe("Body permintaan bukan JSON yang valid.")
    })

    it("Body terlalu besar → 413", () => {
        const wrap = makeRes()
        const err = Object.assign(new Error("payload too large"), {
            type: "entity.too.large",
            status: 413,
        })
        errorHandler(err, makeReq(), wrap.res, jest.fn())
        expect(wrap.statusCode()).toBe(413)
    })

    it("Filesystem ENOENT → 404", () => {
        const wrap = makeRes()
        errorHandler(
            Object.assign(new Error("no such file"), { code: "ENOENT" }),
            makeReq(),
            wrap.res,
            jest.fn(),
        )
        expect(wrap.statusCode()).toBe(404)
    })

    it("Filesystem EACCES → 500 FS.PERMISSION_DENIED (value detail tidak dibocorkan)", () => {
        const wrap = makeRes()
        errorHandler(
            Object.assign(new Error("permission denied: /etc/shadow"), { code: "EACCES" }),
            makeReq(),
            wrap.res,
            jest.fn(),
        )
        expect(wrap.statusCode()).toBe(500)
        const body = wrap.body()
        expect(body.code).toBe("FS.PERMISSION_DENIED")
        expect(JSON.stringify(body)).not.toContain("/etc/shadow")
    })

    it("Bad request subclass → 400 tanpa field tambahan", () => {
        const wrap = makeRes()
        errorHandler(new BadRequestError("Payload tidak valid."), makeReq(), wrap.res, jest.fn())
        expect(wrap.statusCode()).toBe(400)
        expect(wrap.body()).toEqual({ status: "failed", message: "Payload tidak valid." })
    })

    it("Error tak dikenal → 500 INTERNAL.UNEXPECTED + requestId + log", () => {
        const wrap = makeRes()
        errorHandler(new Error("kaboom internal details"), makeReq(), wrap.res, jest.fn())
        expect(wrap.statusCode()).toBe(500)
        const body = wrap.body()
        expect(body.message).toBe("Terjadi kesalahan pada server.")
        expect(body.code).toBe("INTERNAL.UNEXPECTED")
        expect(body.requestId).toBe("req-abc-123")
        // Value asli tidak boleh bocor ke klien.
        expect(JSON.stringify(body)).not.toContain("kaboom")
        expect(consoleErrorSpy).toHaveBeenCalled()
    })
})
