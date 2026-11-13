import { Temporal } from "temporal-polyfill"
import z from "zod"

/**
 * Skema primitif yang dipakai bersama oleh modul keuangan
 * (pembayaran iuran, keuangan, transaction ledger).
 *
 * Versi lama menduplikasi `nominalSchema` di tiap validator; khusus untuk modul
 * keuangan — yang seluruh aturannya bertumpu pada nominal dan tanggal — satu
 * definisi dipakai ulang agar aturan format tidak menyimpang antar endpoint.
 */

/** Nominal uang sebagai string Decimal, maksimal 2 desimal dan wajib > 0. */
export const nominalUangSchema = z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "nominal harus berupa angka positif (maksimal 2 desimal)")
    .refine((value) => Number(value) > 0, { message: "nominal harus lebih besar dari 0" })

/**
 * Tanggal kalender ISO `YYYY-MM-DD`.
 *
 * Regex saja tidak cukup: "2026-02-30" lolos pola tapi bukan tanggal nyata.
 * `Temporal.PlainDate.from` menolaknya, sehingga service tidak perlu menebak.
 */
export const tanggalISOSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "tanggal harus berformat YYYY-MM-DD")
    .refine(
        (value) => {
            try {
                Temporal.PlainDate.from(value)
                return true
            } catch {
                return false
            }
        },
        { message: "tanggal tidak valid" },
    )
