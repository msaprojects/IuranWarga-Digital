import z from "zod"

export const getDetailPesertaByPesertaIDSchema = z.strictObject({
    peserta_id: z.coerce.number().int().positive(),
})

export const getDataDetailPesertaByIdSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
})

export const createDetailPesertaSchema = z.strictObject({
    nama: z.string().min(3, { message: "Nama tidak boleh kosong" }).max(128),
    status_keluarga: z.enum(["KEPALA_KELUARGA", "SUAMI", "ISTRI", "ANAK", "ORANG_TUA", "LAINNYA"]),
    peserta_id: z.coerce
        .number()
        .int()
        .positive({ message: "Peserta ID harus berupa angka positif" }),
})

export const updateDetailPesertaSchema = z.strictObject({
    nama: z.string().min(3, { message: "Nama tidak boleh kosong" }).max(128).optional(),
    status_keluarga: z
        .enum(["KEPALA_KELUARGA", "SUAMI", "ISTRI", "ANAK", "ORANG_TUA", "LAINNYA"])
        .optional(),
    peserta_id: z.coerce
        .number()
        .int()
        .positive({ message: "Peserta ID harus berupa angka positif" })
        .optional(),
    isActive: z.boolean().default(true).optional(),
})

export type GetDetailPesertaByPesertaIDSchema = z.output<typeof getDetailPesertaByPesertaIDSchema>
export type GetDataDetailPesertaByIDShema = z.output<typeof getDataDetailPesertaByIdSchema>
export type CreateDataDetailPesertaSchema = z.output<typeof createDetailPesertaSchema>
export type UpdateDataDetailPesertaSchema = z.output<typeof updateDetailPesertaSchema>
