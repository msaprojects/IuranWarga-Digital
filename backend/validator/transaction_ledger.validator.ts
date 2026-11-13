import z from "zod"
import { LEDGER_SIGN } from "../src/utils/constanta.ts"
import { tanggalISOSchema } from "./shared.ts"

export const transactionLedgerIdSchema = z.strictObject({
    // Primary key ledger adalah UUID v7 (String @id @default(uuid(7))).
    id: z.uuid(),
})

// `dari` / `sampai` menapis `createdAt` (waktu pencatatan), bukan tanggal
// jurnalnya: ledger adalah log append-only dan tidak menyimpan tanggal jurnal.
// Tanpa `.optional()`: `default(100)` sudah membuat input boleh kosong
// sekaligus menjamin output selalu berupa angka.
export const listTransactionLedgerSchema = z.strictObject({
    keuangan_id: z.coerce.number().int().positive().optional(),
    sub_organisasi_id: z.coerce.number().int().positive().optional(),
    tipe: z.enum(LEDGER_SIGN).optional(),
    dari: tanggalISOSchema.optional(),
    sampai: tanggalISOSchema.optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
})

export type TransactionLedgerIdParams = z.output<typeof transactionLedgerIdSchema>
export type ListTransactionLedgerQuery = z.output<typeof listTransactionLedgerSchema>
