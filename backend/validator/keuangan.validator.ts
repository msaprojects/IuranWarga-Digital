import z from "zod"
import { JENIS_KEUANGAN } from "../src/utils/constanta.ts"
import { nominalUangSchema, tanggalISOSchema } from "./shared.ts"

export const keuanganIdSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
})

export const listKeuanganSchema = z.strictObject({
    jenis_keuangan: z.enum(JENIS_KEUANGAN).optional(),
    dari: tanggalISOSchema.optional(),
    sampai: tanggalISOSchema.optional(),
})

// Satu baris buku besar = satu rincian. `pembayaran_iuran_id` sengaja TIDAK
// dibuka di sini: keterkaitan ke pembayaran hanya lahir dari endpoint posting
// pembayaran, agar satu pembayaran tidak bisa diposting dua kali lewat jalur
// berbeda.
const detailKeuanganSchema = z.strictObject({
    nominal: nominalUangSchema,
    keterangan: z.string().trim().max(255).optional(),
})

export const createKeuanganSchema = z.strictObject({
    jenis_keuangan: z.enum(JENIS_KEUANGAN),
    tanggal: tanggalISOSchema,
    keterangan: z.string().trim().max(255).optional(),
    detail: z.array(detailKeuanganSchema).min(1, "minimal satu rincian").max(50),
})

export type KeuanganIdParams = z.output<typeof keuanganIdSchema>
export type ListKeuanganQuery = z.output<typeof listKeuanganSchema>
export type CreateKeuanganBody = z.output<typeof createKeuanganSchema>
