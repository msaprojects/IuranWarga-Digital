import type { Request, Response } from "express"
import type {
    CreatePembayaranIuranBody,
    ListPembayaranIuranQuery,
    PembayaranIuranIdParams,
    PostingPembayaranIuranBody,
} from "../../validator/pembayaran_iuran.validator.ts"
import { pembayaranIuranService } from "../services/pembayaran_iuran.service.ts"
import type { TenantScopedLocal } from "../middlewares/tenant.ts"
import { resHandler } from "../utils/response_handler.ts"

// `user` diisi `authenticateJWT`, `tenant` diisi `requireTenant`. `user_id`
// pada pembayaran & jurnal selalu berasal dari token, tidak dari body.

export type ListPembayaranIuranLocal = TenantScopedLocal & {
    validated: { query: ListPembayaranIuranQuery }
}
export type DetailPembayaranIuranLocal = TenantScopedLocal & {
    validated: { params: PembayaranIuranIdParams }
}
export type CreatePembayaranIuranLocal = TenantScopedLocal & {
    validated: { body: CreatePembayaranIuranBody }
}
export type PostingPembayaranIuranLocal = TenantScopedLocal & {
    validated: { params: PembayaranIuranIdParams; body: PostingPembayaranIuranBody }
}

export const pembayaranIuranController = {
    async getAll(_req: Request, res: Response<unknown, ListPembayaranIuranLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        // Query kosong = seluruh pembayaran tenant; filter dirakit service.
        const { query } = res.locals.validated
        const data = await pembayaranIuranService.getAll(organisasi_id, query)
        resHandler.success(res, 200, "Success", data)
    },
    async getById(_req: Request, res: Response<unknown, DetailPembayaranIuranLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { params } = res.locals.validated
        const data = await pembayaranIuranService.getById(params.id, organisasi_id)
        resHandler.success(res, 200, "Success", data)
    },
    async create(_req: Request, res: Response<unknown, CreatePembayaranIuranLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { userId } = res.locals.user
        const { body } = res.locals.validated
        const data = await pembayaranIuranService.create(body, organisasi_id, userId)
        resHandler.success(res, 201, "Success", data)
    },
    async cancel(_req: Request, res: Response<unknown, DetailPembayaranIuranLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { params } = res.locals.validated
        const data = await pembayaranIuranService.cancel(params.id, organisasi_id)
        resHandler.success(res, 200, "Success", data)
    },
    async posting(_req: Request, res: Response<unknown, PostingPembayaranIuranLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { userId } = res.locals.user
        const { params, body } = res.locals.validated
        const data = await pembayaranIuranService.posting(
            params.id,
            organisasi_id,
            userId,
            body.keterangan,
        )
        resHandler.success(res, 201, "Success", data)
    },
}
