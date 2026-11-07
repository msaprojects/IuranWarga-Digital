import { z } from "zod"

const nominalSchema = z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "nominal_tagihan harus berupa angka positif (maksimal 2 desimal)")
    .refine((value) => Number(value) > 0, { message: "nominal_tagihan harus lebih besar dari 0" })

const tahunSchema = z.coerce.number().int().min(2000).max(2999)
const bulanSchema = z.coerce.number().int().min(1).max(12)

export const tagihanIuranIdSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
})

export const getAllTagihanIuranSchema = z.strictObject({
    organisasi_id: z.coerce.number().int().positive(),
})

export const createTagihanIuranSchema = z.strictObject({
    organisasi_id: z.coerce.number().int().positive(),
    jenis_iuran_id: z.coerce.number().int().positive(),
    tahun: tahunSchema,
    bulan: bulanSchema,
    nominal_tagihan: nominalSchema,
})

export const updateTagihanIuranSchema = z.strictObject({
    jenis_iuran_id: z.coerce.number().int().positive(),
    tahun: tahunSchema,
    bulan: bulanSchema,
    nominal_tagihan: nominalSchema,
})

// Alasan penghapusan wajib diisi (soft delete) untuk audit trail.
export const deleteTagihanIuranSchema = z.strictObject({
    deleted_reason: z.string().trim().min(3).max(255),
})

export type TagihanIuranIdParams = z.output<typeof tagihanIuranIdSchema>
export type GetAllTagihanIuranParams = z.output<typeof getAllTagihanIuranSchema>
export type CreateTagihanIuranBody = z.output<typeof createTagihanIuranSchema>
export type UpdateTagihanIuranBody = z.output<typeof updateTagihanIuranSchema>
export type DeleteTagihanIuranBody = z.output<typeof deleteTagihanIuranSchema>
