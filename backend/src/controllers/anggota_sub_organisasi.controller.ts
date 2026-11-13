import type { Request, Response } from "express"
import { anggotaSubOrganisasiService } from "../services/anggota_sub_organisasi.service.ts"
import type {
    AnggotaSubOrganisasiIdParams,
    CreateAnggotaSubOrganisasiBody,
    UpdateAnggotaSubOrganisasiBody,
} from "../../validator/anggota_sub_organisasi.validator.ts"
import type { SubOrganisasiParentParams } from "../../validator/sub_organisasi.validator.ts"
import type { TenantScopedLocal } from "../middlewares/tenant.ts"
import { resHandler } from "../utils/response_handler.ts"

// `sub_organisasi_id` berasal dari path, tetapi tenancy-nya tetap diverifikasi
// service terhadap `organisasi_id` milik tenant token.

export type AnggotaListLocal = TenantScopedLocal & {
    validated: { params: SubOrganisasiParentParams }
}
export type AnggotaCreateLocal = TenantScopedLocal & {
    validated: { params: SubOrganisasiParentParams; body: CreateAnggotaSubOrganisasiBody }
}
export type AnggotaIdLocal = TenantScopedLocal & {
    validated: { params: AnggotaSubOrganisasiIdParams }
}
export type AnggotaUpdateLocal = TenantScopedLocal & {
    validated: { params: AnggotaSubOrganisasiIdParams; body: UpdateAnggotaSubOrganisasiBody }
}

export const anggotaSubOrganisasiController = {
    async list(_req: Request, res: Response<unknown, AnggotaListLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { sub_organisasi_id } = res.locals.validated.params
        const data = await anggotaSubOrganisasiService.list(sub_organisasi_id, organisasi_id)
        resHandler.success(res, 200, "Success", data)
    },

    async create(_req: Request, res: Response<unknown, AnggotaCreateLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { params, body } = res.locals.validated
        const data = await anggotaSubOrganisasiService.create(
            params.sub_organisasi_id,
            organisasi_id,
            body,
        )
        resHandler.success(res, 201, "Anggota sub organisasi berhasil ditambahkan", data)
    },

    async update(_req: Request, res: Response<unknown, AnggotaUpdateLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { params, body } = res.locals.validated
        const data = await anggotaSubOrganisasiService.update(params.id, organisasi_id, body)
        resHandler.success(res, 200, "Anggota sub organisasi berhasil diperbarui", data)
    },

    async delete(_req: Request, res: Response<unknown, AnggotaIdLocal>): Promise<void> {
        const { organisasi_id } = res.locals.tenant
        const { id } = res.locals.validated.params
        const data = await anggotaSubOrganisasiService.delete(id, organisasi_id)
        resHandler.success(res, 200, "Anggota sub organisasi berhasil dihapus", data)
    },
}
