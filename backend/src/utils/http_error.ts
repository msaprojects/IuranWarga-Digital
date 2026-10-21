/**
 * Error taxonomy untuk seluruh aplikasi.
 *
 * Prinsip:
 *  - `HttpError` tetap menjadi base class agar kode lama (`new HttpError(status, msg)`)
 *    tidak berubah perilaku.
 *  - Subclass bernama (`NotFoundError`, `ConflictError`, dst.) memberi call-site yang
 *    eksplisit + mesin klien bisa branch via `code`, bukan hanya teks `message`.
 *  - `code`machine-readable (UPPER.SNAKE) → stabil walaupun teks `message` diubah.
 *  - `details` → informasi tambahan aman-serialisasi (mis. breakdown field constraint)
 *    yang boleh dikirim ke klien. JANGAN taruh nilai kolom asli di sini (PII).
 */

export type ErrorCode = string

export class HttpError extends Error {
    readonly statusCode: number
    readonly code: ErrorCode
    readonly details?: unknown

    constructor(
        statusCode: number,
        message: string,
        options?: { code?: ErrorCode; details?: unknown; cause?: unknown },
    ) {
        super(message, options?.cause !== undefined ? { cause: options.cause as Error } : undefined)
        this.name = "HttpError"
        this.statusCode = statusCode
        this.code = options?.code ?? `HTTP_${statusCode}`
        if (options?.details !== undefined) this.details = options.details
        // Ensure prototype chain survive transpile untuk instanceof.
        Object.setPrototypeOf(this, new.target.prototype)
        // Tidak perlu stack sampai kelas ini — titik error sebenarnya ada di call-site.
        if (typeof Error.captureStackTrace === "function") {
            Error.captureStackTrace(this, new.target)
        }
    }
}

// ---------- 4xx client errors ----------

export class BadRequestError extends HttpError {
    constructor(
        message = "Permintaan tidak valid.",
        options?: { code?: ErrorCode; details?: unknown; cause?: unknown },
    ) {
        super(400, message, { code: options?.code ?? "CLIENT.BAD_REQUEST", ...options })
        this.name = "BadRequestError"
    }
}

export class UnauthorizedError extends HttpError {
    constructor(
        message = "Tidak terautentikasi.",
        options?: { code?: ErrorCode; details?: unknown; cause?: unknown },
    ) {
        super(401, message, { code: options?.code ?? "AUTH.UNAUTHORIZED", ...options })
        this.name = "UnauthorizedError"
    }
}

export class ForbiddenError extends HttpError {
    constructor(
        message = "Akses ditolak.",
        options?: { code?: ErrorCode; details?: unknown; cause?: unknown },
    ) {
        super(403, message, { code: options?.code ?? "AUTH.FORBIDDEN", ...options })
        this.name = "ForbiddenError"
    }
}

export class NotFoundError extends HttpError {
    constructor(
        message = "Data tidak ditemukan.",
        options?: { code?: ErrorCode; details?: unknown; cause?: unknown },
    ) {
        super(404, message, { code: options?.code ?? "RESOURCE.NOT_FOUND", ...options })
        this.name = "NotFoundError"
    }
}

export class ConflictError extends HttpError {
    constructor(
        message = "Data sudah terdaftar.",
        options?: { code?: ErrorCode; details?: unknown; cause?: unknown },
    ) {
        super(409, message, { code: options?.code ?? "RESOURCE.CONFLICT", ...options })
        this.name = "ConflictError"
    }
}

export class UnprocessableError extends HttpError {
    constructor(
        message = "Data tidak dapat diproses.",
        options?: { code?: ErrorCode; details?: unknown; cause?: unknown },
    ) {
        super(422, message, { code: options?.code ?? "CLIENT.UNPROCESSABLE", ...options })
        this.name = "UnprocessableError"
    }
}

export class TooManyRequestsError extends HttpError {
    constructor(
        message = "Terlalu banyak permintaan.",
        options?: { code?: ErrorCode; details?: unknown; cause?: unknown },
    ) {
        super(429, message, { code: options?.code ?? "CLIENT.RATE_LIMIT", ...options })
        this.name = "TooManyRequestsError"
    }
}

export class PayloadTooLargeError extends HttpError {
    constructor(
        message = "Ukuran permintaan melebihi batas.",
        options?: { code?: ErrorCode; details?: unknown; cause?: unknown },
    ) {
        super(413, message, { code: options?.code ?? "CLIENT.PAYLOAD_TOO_LARGE", ...options })
        this.name = "PayloadTooLargeError"
    }
}

// ---------- 5xx server errors ----------

export class InternalServerError extends HttpError {
    constructor(
        message = "Terjadi kesalahan pada server.",
        options?: { code?: ErrorCode; details?: unknown; cause?: unknown },
    ) {
        super(500, message, { code: options?.code ?? "INTERNAL.UNEXPECTED", ...options })
        this.name = "InternalServerError"
    }
}

export class BadGatewayError extends HttpError {
    constructor(
        message = "Respons tidak valid dari layanan hilir.",
        options?: { code?: ErrorCode; details?: unknown; cause?: unknown },
    ) {
        super(502, message, { code: options?.code ?? "UPSTREAM.BAD_GATEWAY", ...options })
        this.name = "BadGatewayError"
    }
}

export class ServiceUnavailableError extends HttpError {
    constructor(
        message = "Layanan sementara tidak tersedia.",
        options?: { code?: ErrorCode; details?: unknown; cause?: unknown },
    ) {
        super(503, message, { code: options?.code ?? "UPSTREAM.SERVICE_UNAVAILABLE", ...options })
        this.name = "ServiceUnavailableError"
    }
}
