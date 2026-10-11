import { z } from "zod";

const kodeSchema = z
    .string({ error: "Harap masukkan kode organisasi anda." })
    .trim()
    .min(6)
    .max(64);

export const organisasiByKodeParamsSchema = z.strictObject({
    kode: kodeSchema,
});

export const createOrganisasiSchema = z.strictObject({
    kode: kodeSchema,
    nama: z.string().trim().min(1).max(120),
    alamat: z.string().trim().max(500).nullable().default(null),
    website: z.string().trim().max(2048).nullable().default(null),
    isActive: z.boolean().default(true),
    activeAt: z.iso.datetime().nullable().default(null),
});

export const updateOrganisasiSchema = z
    .strictObject({
        kode: kodeSchema.optional(),
        nama: z.string().trim().min(1).max(120).optional(),
        alamat: z.string().trim().max(500).nullable().optional(),
        website: z.string().trim().max(2048).nullable().optional(),
        activeAt: z.iso.datetime().nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "Harap berikan setidaknya satu field untuk diperbarui.",
    });

export type OrganisasiByKodeParams = z.output<typeof organisasiByKodeParamsSchema>;
export type CreateOrganisasiBody = z.output<typeof createOrganisasiSchema>;
export type UpdateOrganisasiBody = z.output<typeof updateOrganisasiSchema>;
