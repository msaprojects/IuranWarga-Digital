import z from "zod";

const getDetailUserByIdSchema = z.object({
    id: z.number().int().positive(),
    kode: z.string().trim().min(6).max(8),
});

const createUserSchema = z.object({
    username: z.string().trim().min(6).max(12),
    name: z.string().trim().min(3).max(45),
    password: z.string().trim().min(8).max(12),
    role: z.enum(["ADMIN", "USER"]),
    organisasi_id: z.number().int().positive(),
    latestLogin: z.string().datetime().nullable().default(null),
});

 const updateUserSchema = z.object({
    username: z.string().trim().min(6).max(12).optional(),
    name: z.string().trim().min(3).max(45).optional(),
    password: z.string().trim().min(8).max(12).optional(),
    role: z.enum(["ADMIN", "USER"]).optional(),
    organisasi_id: z.number().int().positive().optional(),
    latestLogin: z.string().datetime().nullable().default(null),
}).refine((data) => Object.keys(data).length > 0, {
    message: "Harap berikan setidaknya satu field untuk diperbarui.",
});

export type GetDetailUserByIdParams = z.output<typeof getDetailUserByIdSchema>;
export type CreateUserBody = z.output<typeof createUserSchema>;
export type UpdateUserBody = z.output<typeof updateUserSchema>;