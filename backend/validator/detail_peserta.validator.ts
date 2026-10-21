import z from "zod"
import { STATUS_KELUARGA } from "../src/utils/constanta.ts"

export const getDetailPesertaByPesertaIdSchema = z.strictObject({
    peserta_id: z.coerce.number().int().positive(),
})

export const detailPesertaIdSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
})

export const createDetailPesertaSchema = z.strictObject({
    nama: z.string().trim().min(3, { message: "Nama tidak boleh kosong" }).max(128),
    status_keluarga: z.enum(STATUS_KELUARGA),
    peserta_id: z.coerce
        .number()
        .int()
        .positive({ message: "Peserta ID harus berupa angka positif" }),
    isActive: z.boolean().default(true).optional(),
})

export const updateDetailPesertaSchema = z.strictObject({
    nama: z.string().trim().min(3, { message: "Nama tidak boleh kosong" }).max(128).optional(),
    status_keluarga: z.enum(STATUS_KELUARGA).optional(),
    peserta_id: z.coerce
        .number()
        .int()
        .positive({ message: "Peserta ID harus berupa angka positif" })
        .optional(),
    isActive: z.boolean().optional(),
})

export type GetDetailPesertaByPesertaIdParams = z.output<typeof getDetailPesertaByPesertaIdSchema>
export type DetailPesertaIdParams = z.output<typeof detailPesertaIdSchema>
export type CreateDetailPesertaBody = z.output<typeof createDetailPesertaSchema>
export type UpdateDetailPesertaBody = z.output<typeof updateDetailPesertaSchema>
