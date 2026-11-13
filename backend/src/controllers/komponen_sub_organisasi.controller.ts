import type { Request, Response } from "express"
import { komponenSubOrganisasiService } from "../services/komponen_sub_organisasi.service.ts"
import type {
    CreateKomponenSubOrganisasiBody,
    KomponenSubOrganisasiIdParams,
    UpdateKomponenSubOrganisasiBody,
} from "../../validator/komponen_sub_organisasi.validator.ts"
import type { SubOrganisasiParentParams } from "../../validator/sub_organisasi.validator.ts"
import type { TenantScopedLocal } from "../middlewares/tenant.ts"
import { resHandler } from "../utils/response_handler.ts"

export type KomponenListLocal = TenantScopedLocal & {
    validated: { params: SubOrganisasiParentParams }
}
export type KomponenCreateLocal = TenantScopedLocal & {
    validated: { params: SubOrganisasiParentParams; body: CreateKomponenSubOrganisasiBody }
}
export type KomponenIdLocal = TenantScopedLocal & {
    validated: { params: KomponenSubOrganisasiIdParams }
}
export type KomponenUpdateLocal = TenantScopedLocal & {
    validated: { params: KomponenSubOrganisasiIdParams; body: UpdateKomponenSubOrganisasiBody }
}

export const komponenSubOrganisasiController = {
    async list(_req: Request, res: Response<unknown, KomponenListLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { sub_organisasi_id } = res.locals.validated.params
        const data = await komponenSubOrganisasiService.list(sub_organisasi_id, organisasi_id)
        resHandler.success(res, 200, "Success", data)
    },

    async create(_req: Request, res: Response<unknown, KomponenCreateLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { params, body } = res.locals.validated
        const data = await komponenSubOrganisasiService.create(
            params.sub_organisasi_id,
            organisasi_id,
            body,
        )
        resHandler.success(res, 201, "Komponen sub organisasi berhasil dibuat", data)
    },

    async update(_req: Request, res: Response<unknown, KomponenUpdateLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { params, body } = res.locals.validated
        const data = await komponenSubOrganisasiService.update(params.id, organisasi_id, body)
        resHandler.success(res, 200, "Komponen sub organisasi berhasil diperbarui", data)
    },

    async delete(_req: Request, res: Response<unknown, KomponenIdLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { id } = res.locals.validated.params
        const data = await komponenSubOrganisasiService.delete(id, organisasi_id)
        resHandler.success(res, 200, "Komponen sub organisasi berhasil dihapus", data)
    },
}
