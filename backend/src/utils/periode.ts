import type { PeriodeIuran } from "./constanta.ts"

/**
 * Kunci periode kanonik — SATU-SATUNYA dasar anti-tumpang tindih penerbitan tagihan.
 *
 * Format (selalu nol-padded supaya perbandingan string == perbandingan kronologis):
 *   TAHUNAN  -> "2026"
 *   BULANAN  -> "2026-10"
 *   MINGGUAN -> "2026-10-W03"   (minggu ke-N di dalam bulan, N = ceil(hari/7))
 *   HARIAN   -> "2026-10-05"
 *
 * Baik jalur manual (endpoint) maupun cron WAJIB menghasilkan key yang identuk untuk
 * periode yang sama; key ini yang di-index unik (peserta, jenis_iuran, periode), sehingga
 * penerbitan ganda menjadi no-op alih-alih baris duplikat.
 */

export type PeriodeGranularity = PeriodeIuran

export type ParsedPeriode = {
    granularity: PeriodeGranularity
    year: number
    /** 1-12; null untuk TAHUNAN. */
    month: number | null
    /** 1-31; hanya terisi untuk HARIAN. */
    day: number | null
    /** 1-5; hanya terisi untuk MINGGUAN. */
    week: number | null
}

const pad2 = (n: number): string => String(n).padStart(2, "0")

const YEAR_RE = /^(\d{4})$/
const MONTH_RE = /^(\d{4})-(\d{2})$/
const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const WEEK_RE = /^(\d{4})-(\d{2})-W(\d{1,2})$/

/** Minggu ke-N di dalam bulan untuk sebuah tanggal (1..5). */
export function weekOfMonth(ref: Date): number {
    return Math.ceil(ref.getDate() / 7)
}

/**
 * Menghitung key periode kanonik dari sebuah jenis periode + tanggal acuan.
 * Dipakai cron untuk menurunkan periode "sekarang" secara deterministik.
 */
export function computePeriodeKey(granularity: PeriodeGranularity, ref: Date): string {
    const y = ref.getFullYear()
    const m = ref.getMonth() + 1
    switch (granularity) {
        case "TAHUNAN":
            return `${y}`
        case "BULANAN":
            return `${y}-${pad2(m)}`
        case "MINGGUAN":
            return `${y}-${pad2(m)}-W${pad2(weekOfMonth(ref))}`
        case "HARIAN":
            return `${y}-${pad2(m)}-${pad2(ref.getDate())}`
    }
}

/** Memvalidasi sekaligus mem-parse sebuah key periode. Return null bila tidak valid. */
export function parsePeriode(key: string): ParsedPeriode | null {
    const day = DAY_RE.exec(key)
    if (day) {
        const [, y, m, d] = day
        return { granularity: "HARIAN", year: +y!, month: +m!, day: +d!, week: null }
    }

    const week = WEEK_RE.exec(key)
    if (week) {
        const [, y, m, w] = week
        return { granularity: "MINGGUAN", year: +y!, month: +m!, day: null, week: +w! }
    }

    const month = MONTH_RE.exec(key)
    if (month) {
        const [, y, m] = month
        return { granularity: "BULANAN", year: +y!, month: +m!, day: null, week: null }
    }

    const year = YEAR_RE.exec(key)
    if (year) {
        const [, y] = year
        return { granularity: "TAHUNAN", year: +y!, month: null, day: null, week: null }
    }

    return null
}

export function isValidPeriodeKey(key: string): boolean {
    return parsePeriode(key) !== null
}

function daysInMonth(year: number, month1to12: number): number {
    // `new Date(y, m, 0)` = hari terakhir bulan ke-(m-1)+1... pakai index 0-based.
    return new Date(year, month1to12, 0).getDate()
}

/**
 * Kolom tanggal di kontrak memakai codec `date-temporal` -> `Temporal.PlainDate`,
 * BUKAN `Date` JS. Helper ini menyesuaikan sebuah `Date` (mis. dari `z.coerce.date()`)
 * ke `PlainDate` pada kalender lokal, supaya aman dikirim ke create()/update().
 */
export function dateToPlainDate(d: Date): Temporal.PlainDate {
    return new Temporal.PlainDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

/**
 * Perbandingan kronologis dua `PlainDate` lewat ISO `YYYY-MM-DD` (nol-padded,
 * jadi urutan leksikografis == urutan kronologis). Aman lintas varian tipe Temporal.
 */
export function comparePlainDate(a: Temporal.PlainDate, b: Temporal.PlainDate): number {
    const x = a.toString()
    const y = b.toString()
    return x < y ? -1 : x > y ? 1 : 0
}

/** Hari ini (kalender lokal) sebagai `PlainDate` — pembanding batas jatuh_tempo. */
export function startOfTodayPlainDate(): Temporal.PlainDate {
    return dateToPlainDate(new Date())
}

export type PeriodRange = {
    tanggal_terbit: Temporal.PlainDate
    tanggal_jatuh_tempo: Temporal.PlainDate
    tahun: number
    bulan: number | null
}

/**
 * Mengubah key periode menjadi rentang tanggal terbit..jatuh_tempo + label tahun/bulan.
 * jatuh_tempo = akhir periode (bisa ditambahkan grace period di lapisan atas bila perlu).
 * Melempar Error bila key tidak valid (panggilan selalu didahului validasi).
 */
export function periodRange(key: string): PeriodRange {
    const p = parsePeriode(key)
    if (!p) {
        throw new Error(`Kunci periode tidak valid: "${key}"`)
    }

    switch (p.granularity) {
        case "TAHUNAN":
            return {
                tanggal_terbit: new Temporal.PlainDate(p.year, 1, 1),
                tanggal_jatuh_tempo: new Temporal.PlainDate(p.year, 12, 31),
                tahun: p.year,
                bulan: null,
            }
        case "BULANAN": {
            const lastDay = daysInMonth(p.year, p.month!)
            return {
                tanggal_terbit: new Temporal.PlainDate(p.year, p.month!, 1),
                tanggal_jatuh_tempo: new Temporal.PlainDate(p.year, p.month!, lastDay),
                tahun: p.year,
                bulan: p.month,
            }
        }
        case "MINGGUAN": {
            const lastDayOfMonth = daysInMonth(p.year, p.month!)
            const startDay = (p.week! - 1) * 7 + 1
            const endDay = Math.min(p.week! * 7, lastDayOfMonth)
            return {
                tanggal_terbit: new Temporal.PlainDate(p.year, p.month!, startDay),
                tanggal_jatuh_tempo: new Temporal.PlainDate(p.year, p.month!, endDay),
                tahun: p.year,
                bulan: p.month,
            }
        }
        case "HARIAN":
            return {
                tanggal_terbit: new Temporal.PlainDate(p.year, p.month!, p.day!),
                tanggal_jatuh_tempo: new Temporal.PlainDate(p.year, p.month!, p.day!),
                tahun: p.year,
                bulan: p.month,
            }
    }
}
