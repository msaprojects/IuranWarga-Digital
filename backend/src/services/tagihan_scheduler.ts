import { tagihanIuranService } from "./tagihan_iuran.service.ts"

/**
 * Scheduler harian IN-PROSES (keputusan: node-cron / bun schedule style).
 *
 * Menjalankan tagihanIuranService.runDailyJob() satu kali sehari pada jam yang
 * bisa dikonfigurasi lewat env. Aman diulang karena seluruh jalur penerbitan
 * idempoten (unique (peserta, jenis_iuran, periode)) — cron yang terlempar ulang
 * atau tumpang tindih dengan penerbitan manual tidak menghasilkan duplikat.
 *
 * CATATAN: mode in-process hanya duplicate-safe pada SATU instance. Menjalankan
 * beberapa replika server sekaligus tetap aman terhadap duplikat (unik constraint
 * yang menang), tetapi setiap replika akan menyakan job yang sama — pertimbangkan
 * satu instance khusus cron atau scheduler eksternal bila sudah multi-replika.
 *
 * Konfigurasi env:
 *   TAGIHAN_CRON_ENABLED  "false" untuk mematikan (default: aktif)
 *   TAGIHAN_CRON_HOUR     jam lokal 0-23 (default 0)
 *   TAGIHAN_CRON_MINUTE   menit 0-59    (default 5)
 */

let timer: ReturnType<typeof setTimeout> | null = null
let running = false

const clamp = (n: number, min: number, max: number): number =>
    Number.isNaN(n) ? min : Math.min(max, Math.max(min, n))

function msUntilNextRun(hour: number, minute: number, from = new Date()): number {
    const next = new Date(from)
    next.setHours(hour, minute, 0, 0)
    if (next.getTime() <= from.getTime()) {
        next.setDate(next.getDate() + 1)
    }
    return next.getTime() - from.getTime()
}

async function runJob(): Promise<void> {
    // Cegah overlap bila satu run melebihi jeda ke run berikutnya.
    if (running) {
        console.warn(JSON.stringify({ level: "warn", event: "tagihan_cron_skip_overlapping" }))
        return
    }
    running = true
    const started = Date.now()
    try {
        const res = await tagihanIuranService.runDailyJob()
        console.log(
            JSON.stringify({ level: "info", event: "tagihan_cron_done", ms: Date.now() - started, ...res }),
        )
    } catch (err) {
        console.error(
            JSON.stringify({
                level: "error",
                event: "tagihan_cron_failed",
                reason: (err as Error)?.message ?? String(err),
            }),
        )
    } finally {
        running = false
    }
}

export function startTagihanScheduler(): void {
    const enabled = (process.env.TAGIHAN_CRON_ENABLED ?? "true").toLowerCase() !== "false"
    if (!enabled) {
        console.log("[cron] tagihan scheduler nonaktif (TAGIHAN_CRON_ENABLED=false).")
        return
    }

    const hour = clamp(Number(process.env.TAGIHAN_CRON_HOUR ?? 0), 0, 23)
    const minute = clamp(Number(process.env.TAGIHAN_CRON_MINUTE ?? 5), 0, 59)

    const scheduleNext = (): void => {
        const delay = msUntilNextRun(hour, minute)
        timer = setTimeout(() => {
            void runJob().finally(scheduleNext)
        }, delay)
        // Jangan halangi proses keluar (mis. saat `bun --watch` reload).
        timer.unref?.()
        console.log(`[cron] tagihan dijadwalkan pada ${hour}:${String(minute).padStart(2, "0")} (±${Math.round(delay / 60000)} menit lagi).`)
    }

    scheduleNext()
}

export function stopTagihanScheduler(): void {
    if (timer) {
        clearTimeout(timer)
        timer = null
    }
}
