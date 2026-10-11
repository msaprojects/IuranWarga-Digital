import { z } from "zod";

export const organisasiByKodeParamsSchema = z.object({
  kode: z
    .string({ error: "Harap masukkan kode organisasi anda." })
    .trim()
    .min(6)
    .max(64),
});