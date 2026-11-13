import type { Request, Response } from "express"
import type {
    CreateKeuanganBody,
    KeuanganIdParams,
    ListKeuanganQuery,
} from "../../validator/keuangan.validator.ts"
import { keuanganService } from "../services/keuangan.service.ts"
import type { TenantScopedLocal } from "../middlewares/tenant.ts"
import { resHandler } from "../utils/response_handler.ts"

// `organisasi_id` selalu dari token (`requireTenant`); jurnal umum yang dibuat
// di sini tidak boleh menyebut `pembayaran_iuran_id` — jalur itu hanya lewat
// posting pembayaran.

export type ListKeuanganLocal = TenantScopedLocal & {
    validated: { query: ListKeuanganQuery }
}
export type DetailKeuanganLocal = TenantScopedLocal & {
    validated: { params: KeuanganIdParams }
}
export type CreateKeuanganLocal = TenantScopedLocal & {
    validated: { body: CreateKeuanganBody }
}

export const keuanganController = {
    async getAll(_req: Request, res: Response<unknown, ListKeuanganLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { query } = res.locals.validated
        const data = await keuanganService.getAll(organisasi_id, query)
        resHandler.success(res, 200, "Success", data)
    },
    async getById(_req: Request, res: Response<unknown, DetailKeuanganLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { params } = res.locals.validated
        const data = await keuanganService.getById(params.id, organisasi_id)
        resHandler.success(res, 200, "Success", data)
    },
    async create(_req: Request, res: Response<unknown, CreateKeuanganLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { userId } = res.locals.user
        const { body } = res.locals.validated
        const data = await keuanganService.create(body, organisasi_id, userId)
        resHandler.success(res, 201, "Success", data)
    },
}
