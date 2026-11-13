import type { Request, Response } from "express"
import type {
    ListTransactionLedgerQuery,
    TransactionLedgerIdParams,
} from "../../validator/transaction_ledger.validator.ts"
import { transactionLedgerService } from "../services/transaction_ledger.service.ts"
import type { TenantScopedLocal } from "../middlewares/tenant.ts"
import { resHandler } from "../utils/response_handler.ts"

// Modul read-only: controller hanya membaca, karena baris ledger lahir dari
// jurnal keuangan dan tidak boleh diubah setelah tercatat.

export type ListTransactionLedgerLocal = TenantScopedLocal & {
    validated: { query: ListTransactionLedgerQuery }
}
export type DetailTransactionLedgerLocal = TenantScopedLocal & {
    validated: { params: TransactionLedgerIdParams }
}

export const transactionLedgerController = {
    async getAll(_req: Request, res: Response<unknown, ListTransactionLedgerLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { query } = res.locals.validated
        const data = await transactionLedgerService.getAll(organisasi_id, query)
        resHandler.success(res, 200, "Success", data)
    },
    async getById(_req: Request, res: Response<unknown, DetailTransactionLedgerLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { params } = res.locals.validated
        const data = await transactionLedgerService.getById(params.id, organisasi_id)
        resHandler.success(res, 200, "Success", data)
    },
}
