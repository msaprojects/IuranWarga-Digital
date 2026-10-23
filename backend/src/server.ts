import "dotenv/config"
import http from "node:http"
import app from "./app.ts"
import { db } from "./prisma/db.ts"
import { startTagihanScheduler, stopTagihanScheduler } from "./services/tagihan_scheduler.ts"

const PORT = Number(process.env.PORT ?? 3000)

// ---------- Startup validation ----------
//
// Fail-fast: kalau env wajib hilang, matikan proses SEBELUM listen. Ini jauh lebih
// baik daripada error muncul saat request pertama (sulit di-debug, membingungkan klien).
const REQUIRED_ENV = ["DATABASE_URL", "JWT_SECRET", "ENCRYPTED_KEY", "URL_PATH"] as const
const missing = REQUIRED_ENV.filter((key) => !process.env[key])
if (missing.length > 0) {
    console.error(`[startup] Missing required env vars: ${missing.join(", ")}`)
    process.exit(1)
}

const server = app.listen(PORT, (): void => {
    console.log(`[startup] Server is running on port ${PORT}`)
})

// Scheduler harian penerbitan tagihan (in-process, idempoten). Aktif kecuali dimatikan
// via TAGIHAN_CRON_ENABLED=false.
startTagihanScheduler()

// ---------- Process-level safety nets ----------
//
// Tanpa ini, Node >= 15 default-nya MATI saat unhandled rejection — bagus, tapi
// kita ingin matinya secara graceful (HTTP drained + DB pool close).
let shuttingDown = false

const shutdown = (reason: string, exitCode: number): void => {
    if (shuttingDown) return
    shuttingDown = true

    // Hentikan scheduler lebih dulu agar tidak ada job baru yang menembak DB saat drain.
    stopTagihanScheduler()

    console.error(`[shutdown] ${reason}; closing HTTP server then DB pool.`)

    // 1. Stop menerima koneksi baru; selesaikan yang sedang berjalan (max 10s).
    server.close(() => {
        void finalize(reason, exitCode)
    })
    // Node 18.2+: paksa tutup socket idle agar tidak menggantung keep-alive.
    if (
        typeof (server as http.Server & { closeIdleConnections?: () => void })
            .closeIdleConnections === "function"
    ) {
        ;(server as http.Server & { closeIdleConnections: () => void }).closeIdleConnections()
    }
    setTimeout(() => {
        console.error(`[shutdown] Force exit after 10s grace (${reason}).`)
        process.exit(exitCode)
    }, 10_000).unref()
}

const finalize = async (reason: string, exitCode: number): Promise<void> => {
    try {
        await db.close()
    } catch (err) {
        console.error(`[shutdown] DB close failed (${reason}):`, (err as Error)?.message ?? err)
    }
    process.exit(exitCode)
}

process.on("SIGTERM", () => shutdown("SIGTERM", 0))
process.on("SIGINT", () => shutdown("SIGINT", 0))

process.on("unhandledRejection", (reason) => {
    // Log dengan requestId jika tersedia tidak mungkin di sini (out-of-band),
    // jadi cukup structured minimal.

    console.error(
        JSON.stringify({
            level: "error",
            event: "unhandledRejection",
            reason:
                reason instanceof Error
                    ? { name: reason.name, message: reason.message }
                    : String(reason),
        }),
    )
    shutdown("unhandledRejection", 1)
})

process.on("uncaughtException", (err) => {
    console.error(
        JSON.stringify({
            level: "error",
            event: "uncaughtException",
            name: err?.name,
            message: err?.message,
        }),
    )
    shutdown("uncaughtException", 1)
})
