import type { Request, Response } from "express"
import { subOrganisasiService } from "../services/sub_organisasi.service.ts"
import type {
    CreateSubOrganisasiBody,
    SubOrganisasiIdParams,
    UpdateSubOrganisasiBody,
} from "../../validator/sub_organisasi.validator.ts"
import type { TenantScopedLocal } from "../middlewares/tenant.ts"
import { resHandler } from "../utils/response_handler.ts"

// `user` diisi `authenticateJWT`, `tenant` diisi `requireTenant` — satu-satunya
// sumber `organisasi_id` yang boleh dipercaya controller.

export type SubOrganisasiListLocal = TenantScopedLocal
export type SubOrganisasiIdLocal = TenantScopedLocal & {
    validated: { params: SubOrganisasiIdParams }
}
export type CreateSubOrganisasiLocal = TenantScopedLocal & {
    validated: { body: CreateSubOrganisasiBody }
}
export type UpdateSubOrganisasiLocal = TenantScopedLocal & {
    validated: { params: SubOrganisasiIdParams; body: UpdateSubOrganisasiBody }
}

export const subOrganisasiController = {
    async getAll(_req: Request, res: Response<unknown, SubOrganisasiListLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const data = await subOrganisasiService.getAll(organisasi_id)
        resHandler.success(res, 200, "Success", data)
    },

    async getById(_req: Request, res: Response<unknown, SubOrganisasiIdLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { id } = res.locals.validated.params
        const data = await subOrganisasiService.getById(id, organisasi_id)
        resHandler.success(res, 200, "Success", data)
    },

    async create(_req: Request, res: Response<unknown, CreateSubOrganisasiLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const data = await subOrganisasiService.create(res.locals.validated.body, organisasi_id)
        resHandler.success(res, 201, "Sub organisasi berhasil dibuat", data)
    },

    async update(_req: Request, res: Response<unknown, UpdateSubOrganisasiLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { params, body } = res.locals.validated
        const data = await subOrganisasiService.update(params.id, organisasi_id, body)
        resHandler.success(res, 200, "Sub organisasi berhasil diperbarui", data)
    },

    async deactivate(
        _req: Request,
        res: Response<unknown, SubOrganisasiIdLocal>,
    ): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { id } = res.locals.validated.params
        const data = await subOrganisasiService.deactivate(id, organisasi_id)
        resHandler.success(res, 200, "Sub organisasi berhasil dinonaktifkan", data)
    },
}
