import z from "zod"
import { STATUS_PEMBAYARAN } from "../src/utils/constanta.ts"
import { nominalUangSchema, tanggalISOSchema } from "./shared.ts"

export const pembayaranIuranIdSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
})

// Filter daftar: seluruh field opsional. Service menyusun predikat hanya dari
// field yang benar-benar dikirim, sehingga filter kosong = semua pembayaran
// milik tenant pemanggil.
export const listPembayaranIuranSchema = z.strictObject({
    tagihan_iuran_id: z.coerce.number().int().positive().optional(),
    peserta_id: z.coerce.number().int().positive().optional(),
    status: z.enum(STATUS_PEMBAYARAN).optional(),
    dari: tanggalISOSchema.optional(),
    sampai: tanggalISOSchema.optional(),
})

export const createPembayaranIuranSchema = z.strictObject({
    tagihan_iuran_id: z.coerce.number().int().positive(),
    nominal_bayar: nominalUangSchema,
    tanggal_bayar: tanggalISOSchema,
})

// Body opsional: hanya keterangan jurnal yang boleh ditimpa. Nominal & relasi
// pembayaran tidak bisa diubah — histori pembayaran bersifat append-only.
export const postingPembayaranIuranSchema = z.strictObject({
    keterangan: z.string().trim().min(3).max(255).optional(),
})

export type PembayaranIuranIdParams = z.output<typeof pembayaranIuranIdSchema>
export type ListPembayaranIuranQuery = z.output<typeof listPembayaranIuranSchema>
export type CreatePembayaranIuranBody = z.output<typeof createPembayaranIuranSchema>
export type PostingPembayaranIuranBody = z.output<typeof postingPembayaranIuranSchema>
