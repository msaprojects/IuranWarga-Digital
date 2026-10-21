import z from "zod"
import { JENIS_PESERTA } from "../src/utils/constanta.ts"

// Daftar peserta/detail peserta per organisasi: `(id, kode)` di URL.
export const getDetailPesertaByIdAndKodeOrganisasiSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
    kode: z.string().trim().min(6).max(8),
})

// Route hanya `/peserta/:id`, tanpa scope organisasi.
export const pesertaIdSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
})

export const decryptQRCodeStringSchema = z.strictObject({
    qrCodeString: z.string().trim().min(3).max(256),
})

export const createPesertaSchema = z.strictObject({
    kode: z.string().trim().min(6).max(8).optional(),
    nama: z.string().trim().min(3).max(45),
    nomor_rumah: z.string().trim().min(1).max(20).nullable().optional(),
    alamat: z.string().trim().min(3).max(128).nullable().optional(),
    deskripsi: z.string().trim().min(3).max(256).nullable().optional(),
    qr_token: z.string().trim().min(3).max(256).nullable().optional(),
    isActive: z.boolean().default(true).optional(),
    organisasi_id: z.coerce.number().int().positive(),
    user_id: z.coerce.number().int().positive().nullable().optional(),
    jenis_peserta: z.enum(JENIS_PESERTA).default(JENIS_PESERTA[0]).optional(),
})

// PATCH: semua field opsional, `kode` immutable (dihapus dari body),
// field nullable boleh di-set null secara eksplisit.
export const updatePesertaSchema = z.strictObject({
    nama: z.string().trim().min(3).max(45).optional(),
    nomor_rumah: z.string().trim().min(1).max(20).nullable().optional(),
    alamat: z.string().trim().min(3).max(128).nullable().optional(),
    deskripsi: z.string().trim().min(3).max(256).nullable().optional(),
    qr_token: z.string().trim().min(3).max(256).nullable().optional(),
    isActive: z.boolean().optional(),
    user_id: z.coerce.number().int().positive().nullable().optional(),
    jenis_peserta: z.enum(JENIS_PESERTA).optional()
})

export const downloadQrCodePesertaSchema = z.strictObject({
    qrUrl: z.string().trim().min(3).max(256),
})

export const generateQrCodePesertaSchema = z.strictObject({
    kodePeserta: z.string().trim().min(6).max(8),
    kodeOrganisasi: z.string().trim().min(6).max(8),
})

export type GetDetailPesertaByIdAndKodeOrganisasiParams = z.output<
    typeof getDetailPesertaByIdAndKodeOrganisasiSchema
>
export type PesertaIdParams = z.output<typeof pesertaIdSchema>
export type CreatePesertaBody = z.output<typeof createPesertaSchema>
export type UpdatePesertaBody = z.output<typeof updatePesertaSchema>
export type DecryptQRCodeStringBody = z.output<typeof decryptQRCodeStringSchema>
export type DownloadQrCodePesertaBody = z.output<typeof downloadQrCodePesertaSchema>
export type GenerateQrCodePesertaBody = z.output<typeof generateQrCodePesertaSchema>
