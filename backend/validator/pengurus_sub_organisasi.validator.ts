import z from "zod"

export const pengurusSubOrganisasiIdSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
})

export const createPengurusSubOrganisasiSchema = z.strictObject({
    user_id: z.coerce.number().int().positive({ message: "User ID harus berupa angka positif" }),
    // Kolom `jabatan` bertipe String (bukan enum) agar organisasi bisa memakai
    // istilah sendiri, mis. KETUA / SEKRETARIS / BENDAHARA / KOORDINATOR.
    jabatan: z.string().trim().min(3, { message: "Jabatan tidak boleh kosong" }).max(64),
    isActive: z.boolean().default(true).optional(),
})

// Pasangan (sub_organisasi_id, user_id) bersifat identitas: jabatan boleh
// diubah, tetapi pemindahan user = hapus lalu daftarkan ulang.
export const updatePengurusSubOrganisasiSchema = z.strictObject({
    jabatan: z.string().trim().min(3, { message: "Jabatan tidak boleh kosong" }).max(64).optional(),
    isActive: z.boolean().optional(),
})

export type PengurusSubOrganisasiIdParams = z.output<typeof pengurusSubOrganisasiIdSchema>
export type CreatePengurusSubOrganisasiBody = z.output<typeof createPengurusSubOrganisasiSchema>
export type UpdatePengurusSubOrganisasiBody = z.output<typeof updatePengurusSubOrganisasiSchema>
