import z from "zod";

export const getDetailPesertaByIdAndKodeOrganisasiSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
    kode: z.string().trim().min(6).max(8),
});

export const getDetailPesertaByIdParamsSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
});

export const decryptQRCodeStringSchema = z.strictObject({
    qrCodeString: z.string().trim().min(3).max(256),
});

export const createPesertaSchema = z.strictObject({
    kode: z.string().trim().min(6).max(8).optional(),
    nama: z.string().trim().min(3).max(45),
    nomor_rumah: z.string().trim().min(1).max(20).optional(),
    alamat: z.string().trim().min(3).max(128).optional(),
    deskripsi: z.string().trim().min(3).max(256).optional(),
    qr_token: z.string().trim().min(3).max(256).optional(),
    isActive: z.boolean().default(true).optional(),
    organisasi_id: z.number().int().positive(),
    user_id: z.number().int().positive(),
});

export const updatePesertaSchema = z.strictObject({
    kode: z.string().trim().min(6).max(8).optional(),
    nama: z.string().trim().min(3).max(45),
    nomor_rumah: z.string().trim().min(1).max(20).optional(),
    alamat: z.string().trim().min(3).max(128).optional(),
    deskripsi: z.string().trim().min(3).max(256).optional(),
    qr_token: z.string().trim().min(3).max(256).optional(),
    isActive: z.boolean().default(true).optional(),
    user_id: z.number().int().positive(),
});

export type GetDetailPesertaByIdAndKodeOrganisasiParams = z.output<
    typeof getDetailPesertaByIdAndKodeOrganisasiSchema
>;
export type GetDetailPesertaByIdParams = z.output<typeof getDetailPesertaByIdParamsSchema>;
export type CreatePesertaBody = z.output<typeof createPesertaSchema>;
export type UpdatePesertaBody = z.output<typeof updatePesertaSchema>;
export type DecryptQRCodeStringBody = z.output<typeof decryptQRCodeStringSchema>;
