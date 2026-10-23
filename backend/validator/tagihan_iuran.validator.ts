import { z } from "zod"

// Kunci periode kanonik — harus sesuai utils/periode.ts:
//   "2026" | "2026-10" | "2026-10-W03" | "2026-10-05"
// Granularitas (HARIAN/MINGGUAN/TAHUNAN) dicocokkan dengan jenis_iuran di service.
const PERIODE_REGEX = /^\d{4}(-\d{2}(-(W\d{1,2}|\d{2}))?)?$/

export const detailTagihanIDSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
})

export const createTagihanSchema = z.strictObject({
    jenis_iuran_id: z.coerce.number().int().positive(),
    periode: z
        .string()
        .trim()
        .regex(PERIODE_REGEX, 'periode tidak valid (contoh: "2026", "2026-10", "2026-10-W03", "2026-10-05")'),
    // Opsional: target peserta spesifik. Bila kosong, service menerbitkan untuk
    // SEMUA peserta aktif yang cocok jenis_peserta jenis_iuran tersebut.
    peserta_ids: z.array(z.coerce.number().int().positive()).min(1).optional(),
    keterangan: z.string().trim().max(255).nullish(),
})

export type TagihanIdParams = z.output<typeof detailTagihanIDSchema>
export type CreateTagihanBody = z.output<typeof createTagihanSchema>
