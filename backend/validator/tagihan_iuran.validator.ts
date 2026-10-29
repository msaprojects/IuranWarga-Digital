import { z } from "zod"

export const createTagihanIuran = z.strictObject({
    organisasi_id: z.number().int().positive().optional(),
    jenis_iuran_id: z.number().int().positive().optional(),
    tahun: z.coerce.number().int().positive(),
    bulan: z.string().trim().min(3),
    nominal_tagihan: z.number().int(),
})
