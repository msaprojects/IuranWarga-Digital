import z from "zod";

export const getDetailUserByIdAndKodeOrganisasiSchema = z.strictObject({
    id: z.number().int().positive(),
    kode: z.string().trim().min(6).max(8),
});

const getDetailUserByIdParamsSchema = z.strictObject({
    id: z.number().int().positive(),
});

const createUserSchema = z.strictObject({
    username: z.string().trim().min(6).max(12),
    name: z.string().trim().min(3).max(45),
    password: z.string().trim().min(8).max(12),
    role: z.enum(["ADMIN", "USER"]),
    organisasi_id: z.number().int().positive(),
    isActive: z.boolean().default(true),
    email: z.string().email().nullable().default(null),
    contact: z.string().trim().nullable().default(null),
});

 const updateUserSchema = z.strictObject({
    username: z.string().trim().min(6).max(12).optional(),
    name: z.string().trim().min(3).max(45).optional(),
    password: z.string().trim().min(8).max(12).optional(),
    role: z.enum(["ADMIN", "USER"]).optional(),
    organisasi_id: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
    email: z.string().email().nullable().default(null).optional(),
    contact: z.string().trim().nullable().default(null).optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "Harap berikan setidaknya satu field untuk diperbarui.",
});

export type GetDetailUserByIdAndKodeOrganisasiParams = z.output<typeof getDetailUserByIdAndKodeOrganisasiSchema>;
export type GetDetailUserByIdParams = z.output<typeof getDetailUserByIdParamsSchema>;
export type CreateUserBody = z.output<typeof createUserSchema>;
export type UpdateUserBody = z.output<typeof updateUserSchema>;