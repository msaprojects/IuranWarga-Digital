import type { Request, Response } from "express"
import { pengurusSubOrganisasiService } from "../services/pengurus_sub_organisasi.service.ts"
import type {
    CreatePengurusSubOrganisasiBody,
    PengurusSubOrganisasiIdParams,
    UpdatePengurusSubOrganisasiBody,
} from "../../validator/pengurus_sub_organisasi.validator.ts"
import type { SubOrganisasiParentParams } from "../../validator/sub_organisasi.validator.ts"
import type { TenantScopedLocal } from "../middlewares/tenant.ts"
import { resHandler } from "../utils/response_handler.ts"

export type PengurusListLocal = TenantScopedLocal & {
    validated: { params: SubOrganisasiParentParams }
}
export type PengurusCreateLocal = TenantScopedLocal & {
    validated: { params: SubOrganisasiParentParams; body: CreatePengurusSubOrganisasiBody }
}
export type PengurusIdLocal = TenantScopedLocal & {
    validated: { params: PengurusSubOrganisasiIdParams }
}
export type PengurusUpdateLocal = TenantScopedLocal & {
    validated: { params: PengurusSubOrganisasiIdParams; body: UpdatePengurusSubOrganisasiBody }
}

export const pengurusSubOrganisasiController = {
    async list(_req: Request, res: Response<unknown, PengurusListLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { sub_organisasi_id } = res.locals.validated.params
        const data = await pengurusSubOrganisasiService.list(sub_organisasi_id, organisasi_id)
        resHandler.success(res, 200, "Success", data)
    },

    async create(_req: Request, res: Response<unknown, PengurusCreateLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { params, body } = res.locals.validated
        const data = await pengurusSubOrganisasiService.create(
            params.sub_organisasi_id,
            organisasi_id,
            body,
        )
        resHandler.success(res, 201, "Pengurus sub organisasi berhasil ditambahkan", data)
    },

    async update(_req: Request, res: Response<unknown, PengurusUpdateLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { params, body } = res.locals.validated
        const data = await pengurusSubOrganisasiService.update(params.id, organisasi_id, body)
        resHandler.success(res, 200, "Pengurus sub organisasi berhasil diperbarui", data)
    },

    async delete(_req: Request, res: Response<unknown, PengurusIdLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { id } = res.locals.validated.params
        const data = await pengurusSubOrganisasiService.delete(id, organisasi_id)
        resHandler.success(res, 200, "Pengurus sub organisasi berhasil dihapus", data)
    },
}
