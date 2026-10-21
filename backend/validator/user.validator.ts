import { z } from "zod"
import { ASSIGNABLE_USER_ROLES } from "../src/utils/constanta.ts"

export const getDetailUserByIdAndKodeOrganisasiSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
    kode: z.string().trim().min(6).max(8),
})

export const getDetailUserByIdParamsSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
})

export const createUserSchema = z.strictObject({
    username: z.string().trim().min(6).max(12),
    name: z.string().trim().min(3).max(45),
    password: z.string().trim().min(8).max(12),
    role: z.enum(ASSIGNABLE_USER_ROLES),
    organisasi_id: z.coerce.number().int().positive(),
    isActive: z.boolean().default(true).optional(),
    email: z.string().email().trim().max(320).nullable().default(null),
    contact: z.string().trim().max(20).nullable().default(null),
})

export const updateUserSchema = z
    .strictObject({
        username: z.string().trim().min(6).max(12).optional(),
        name: z.string().trim().min(3).max(45).optional(),
        password: z.string().trim().min(8).max(12).optional(),
        role: z.enum(ASSIGNABLE_USER_ROLES).optional(),
        organisasi_id: z.coerce.number().int().positive().optional(),
        isActive: z.boolean().optional(),
        // PATCH: `.nullable().optional()` TANPA `.default(null)`.
        // Default akan memaksa field yang tidak dikirim menjadi `null`,
        // sehingga tanpa sengaja menghapus data. `null` hanya terjadi bila
        // klien mengirim null secara eksplisit.
        email: z.string().email().trim().max(320).nullable().optional(),
        contact: z.string().trim().max(20).nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "Harap berikan setidaknya satu field untuk diperbarui.",
    })

export const loginUserSchema = z.strictObject({
    username: z.string().trim().min(6).max(12),
    password: z.string().trim().min(8).max(12),
})

export type GetDetailUserByIdAndKodeOrganisasiParams = z.output<
    typeof getDetailUserByIdAndKodeOrganisasiSchema
>
export type GetDetailUserByIdParams = z.output<typeof getDetailUserByIdParamsSchema>
export type CreateUserBody = z.output<typeof createUserSchema>
export type UpdateUserBody = z.output<typeof updateUserSchema>
export type LoginUserBody = z.output<typeof loginUserSchema>
