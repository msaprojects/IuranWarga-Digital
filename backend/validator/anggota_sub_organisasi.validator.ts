import z from "zod"

export const anggotaSubOrganisasiIdSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
})

export const createAnggotaSubOrganisasiSchema = z.strictObject({
    peserta_id: z.coerce
        .number()
        .int()
        .positive({ message: "Peserta ID harus berupa angka positif" }),
    isActive: z.boolean().default(true).optional(),
})

// Pasangan (sub_organisasi_id, peserta_id) bersifat identitas dan tidak bisa
// dipindah lewat PATCH: pindah sub-organisasi = hapus lalu daftarkan ulang.
export const updateAnggotaSubOrganisasiSchema = z.strictObject({
    isActive: z.boolean(),
})

export type AnggotaSubOrganisasiIdParams = z.output<typeof anggotaSubOrganisasiIdSchema>
export type CreateAnggotaSubOrganisasiBody = z.output<typeof createAnggotaSubOrganisasiSchema>
export type UpdateAnggotaSubOrganisasiBody = z.output<typeof updateAnggotaSubOrganisasiSchema>
