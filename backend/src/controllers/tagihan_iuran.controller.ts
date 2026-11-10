import type { Request, Response } from "express"
import type {
    GetAllTagihanIuranParams,
    TagihanIuranIdParams,
    CreateTagihanIuranBody,
    UpdateTagihanIuranBody,
    DeleteTagihanIuranBody,
} from "../../validator/tagihan_iuran.validator.ts"
import { tagihanIuranService } from "../services/tagihan_iuran.ts"
import type { TenantScopedLocal } from "../middlewares/tenant.ts"
import { resHandler } from "../utils/response_handler.ts"

// `user` diisi `authenticateJWT`, `tenant` diisi `requireTenant` — sumber
// tunggal `organisasi_id` di controller.

export type GetAllTagihanIuranLocal = TenantScopedLocal & {
    validated: { params: GetAllTagihanIuranParams }
}
export type DetailTagihanIuranByIDLocal = TenantScopedLocal & {
    validated: { params: TagihanIuranIdParams }
}
export type CreateTagihanIuranLocal = TenantScopedLocal & {
    validated: { body: CreateTagihanIuranBody }
}
export type UpdateTagihanIuranLocal = TenantScopedLocal & {
    validated: { params: TagihanIuranIdParams; body: UpdateTagihanIuranBody }
}
export type DeleteTagihanIuranLocal = TenantScopedLocal & {
    validated: { params: TagihanIuranIdParams; body: DeleteTagihanIuranBody }
}

export const tagihanIuranController = {
    async getAllByOrganisasi(
        _req: Request,
        res: Response<unknown, GetAllTagihanIuranLocal>,
    ): Promise<void> {
        // Tenant dari token (lihat `requireTenant`), bukan dari path.
        const { organisasi_id } = res.locals.tenant

        const data = await tagihanIuranService.getAll(organisasi_id)
        resHandler.success(res, 200, "Success", data)
    },
    async createTagihanIuran(
        _req: Request,
        res: Response<unknown, CreateTagihanIuranLocal>,
    ): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { body } = res.locals.validated
        const data = await tagihanIuranService.create({ ...body, organisasi_id })
        resHandler.success(res, 201, "Success", data)
    },
    async updateTagihanIuran(
        _req: Request,
        res: Response<unknown, UpdateTagihanIuranLocal>,
    ): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { params, body } = res.locals.validated
        const data = await tagihanIuranService.update(params.id, organisasi_id, body)
        resHandler.success(res, 200, "Success", data)
    },
    async deleteTagihanIuran(
        _req: Request,
        res: Response<unknown, DeleteTagihanIuranLocal>,
    ): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { params, body } = res.locals.validated
        const { userId } = res.locals.user
        const data = await tagihanIuranService.delete(
            params.id,
            organisasi_id,
            userId,
            body.deleted_reason,
        )
        resHandler.success(res, 200, "Success", data)
    },
}
