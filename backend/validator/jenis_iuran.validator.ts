import { z } from "zod"
import { JENIS_PESERTA, PERIODE_IURAN } from "../src/utils/constanta.ts"

// Nominal disimpan sebagai Decimal di basis data, jadi kontrak API memakai string
// untuk menghindari kehilangan presisi floating-point pada nilai uang.
const nominalSchema = z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "nominal harus berupa angka positif (maksimal 2 desimal)")
    .refine((value) => Number(value) > 0, { message: "nominal harus lebih besar dari 0" })

export const detailJenisIuranIDSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
})

export const createJenisIuranSchema = z.strictObject({
    judul: z.string().trim().min(3).max(45),
    periode_iuran: z.enum(PERIODE_IURAN),
    jenis_peserta: z.enum(JENIS_PESERTA),
    nominal: nominalSchema,
    tanggal_awal: z.coerce.date(),
    tanggal_akhir: z.coerce.date(),
    isActive: z.boolean().default(true).optional(),
    organisasi_id: z.coerce.number().int().positive(),
})

export const updateJenisIuranSchema = z.strictObject({
    judul: z.string().trim().min(3).max(45).optional(),
    periode_iuran: z.enum(PERIODE_IURAN).optional(),
    jenis_peserta: z.enum(JENIS_PESERTA).optional(),
    nominal: nominalSchema.optional(),
    tanggal_awal: z.coerce.date().optional(),
    tanggal_akhir: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
    organisasi_id: z.coerce.number().int().positive().optional(),
})

export type JenisIuranIdParams = z.output<typeof detailJenisIuranIDSchema>
export type CreateJenisIuranBody = z.output<typeof createJenisIuranSchema>
export type UpdateJenisIuranBody = z.output<typeof updateJenisIuranSchema>
