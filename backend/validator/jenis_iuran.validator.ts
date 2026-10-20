import { z } from "zod"

export const detailJenisIuranIDSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
})

export const createJenisIuranSchema = z.strictObject({
    judul: z.string().trim().min(3).max(45),
    periode_iuran: z.enum(["HARIAN", "MINGGUAN", "BULANAN", "TAHUNAN"]),
    nominal: z.number(),
    tanggal_awal: z.coerce.date(),
    tanggal_akhir: z.coerce.date(),
    isActive: z.boolean().default(true).optional(),
    organisasi_id: z.coerce.number().int().positive(),
})

export const updateJenisIuranSchema = z.strictObject({
    judul: z.string().trim().min(3).max(45).optional(),
    periode_iuran: z.enum(["HARIAN", "MINGGUAN", "BULANAN", "TAHUNAN"]).optional(),
    nominal: z.number().optional(),
    tanggal_awal: z.coerce.date().optional(),
    tanggal_akhir: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
    organisasi_id: z.coerce.number().int().positive().optional(),
})

export type DetailJenisIuranIDSchema = z.output<typeof detailJenisIuranIDSchema>
export type CreateJenisIuranIDSchema = z.output<typeof createJenisIuranSchema>
export type UpdateJenisIuranIDSchema = z.output<typeof updateJenisIuranSchema>
