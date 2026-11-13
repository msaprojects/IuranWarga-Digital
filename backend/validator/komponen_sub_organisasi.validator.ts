import z from "zod"

export const komponenSubOrganisasiIdSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
})

// `Decimal` di contract dikirim sebagai string agar presisi uang tidak hilang
// lewat floating point — samakan aturannya dengan `nominal_tagihan`.
const nominalSchema = z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "nominal harus berupa angka positif (maksimal 2 desimal)")
    .refine((value) => Number(value) > 0, { message: "nominal harus lebih besar dari 0" })

export const createKomponenSubOrganisasiSchema = z.strictObject({
    jenis_iuran_id: z.coerce
        .number()
        .int()
        .positive({ message: "Jenis Iuran ID harus berupa angka positif" }),
    nominal: nominalSchema,
    isActive: z.boolean().default(true).optional(),
})

// Pasangan (sub_organisasi_id, jenis_iuran_id) bersifat identitas: tarif dan
// status boleh diubah, tetapi mengganti jenis iuran = hapus lalu buat ulang.
export const updateKomponenSubOrganisasiSchema = z.strictObject({
    nominal: nominalSchema.optional(),
    isActive: z.boolean().optional(),
})

export type KomponenSubOrganisasiIdParams = z.output<typeof komponenSubOrganisasiIdSchema>
export type CreateKomponenSubOrganisasiBody = z.output<typeof createKomponenSubOrganisasiSchema>
export type UpdateKomponenSubOrganisasiBody = z.output<typeof updateKomponenSubOrganisasiSchema>
