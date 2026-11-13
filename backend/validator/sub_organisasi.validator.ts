import z from "zod"

const namaSchema = z
    .string()
    .trim()
    .min(3, { message: "Nama sub organisasi tidak boleh kosong" })
    .max(128)

// `deskripsi` boleh dikosongkan eksplisit (null), bukan hanya dihilangkan.
const deskripsiSchema = z.string().trim().max(255).nullable()

export const subOrganisasiIdSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
})

/** Params induk untuk route bersarang: /sub-organisasi/:sub_organisasi_id/... */
export const subOrganisasiParentParamsSchema = z.strictObject({
    sub_organisasi_id: z.coerce.number().int().positive(),
})

export const createSubOrganisasiSchema = z.strictObject({
    nama: namaSchema,
    deskripsi: deskripsiSchema.optional(),
    // true = laporan keuangan sub-organisasi dipisah dari organisasi induk.
    pisah_laporan: z.boolean().default(false).optional(),
    isActive: z.boolean().default(true).optional(),
})

// Semua field opsional: PATCH hanya mengubah yang dikirim.
export const updateSubOrganisasiSchema = z.strictObject({
    nama: namaSchema.optional(),
    deskripsi: deskripsiSchema.optional(),
    pisah_laporan: z.boolean().optional(),
    isActive: z.boolean().optional(),
})

export type SubOrganisasiIdParams = z.output<typeof subOrganisasiIdSchema>
export type SubOrganisasiParentParams = z.output<typeof subOrganisasiParentParamsSchema>
export type CreateSubOrganisasiBody = z.output<typeof createSubOrganisasiSchema>
export type UpdateSubOrganisasiBody = z.output<typeof updateSubOrganisasiSchema>
