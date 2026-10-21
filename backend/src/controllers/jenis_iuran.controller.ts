import type { Request, Response } from "express"
import type { OrganisasiByKodeParams } from "../../validator/organisasi.validator.ts"
import type {
    JenisIuranIdParams,
    CreateJenisIuranBody,
    UpdateJenisIuranBody,
} from "../../validator/jenis_iuran.validator.ts"
import { jenisIuranService } from "../services/jenis_iuran.service.ts"
import { resHandler } from "../utils/response_handler.ts"

export type OrganisasiKodeInputLocal = { validated: { params: OrganisasiByKodeParams } }
export type DetailJenisIuranByIDLocal = { validated: { params: JenisIuranIdParams } }
export type CreateJenisIuranLocal = { validated: { body: CreateJenisIuranBody } }
export type UpdateJenisIuranLocal = {
    validated: { params: JenisIuranIdParams; body: UpdateJenisIuranBody }
}

export const jenisIuranController = {
    async getJenisIuranByOrganisasi(
        _req: Request,
        res: Response<unknown, OrganisasiKodeInputLocal>,
    ): Promise<void> {
        const { kode } = res.locals.validated.params

        const data = await jenisIuranService.getJenisIuranByKodeOrganisasi(kode)
        resHandler.success(res, 200, "Success", data)
    },
    async getDetailJenisIuranByID(
        _req: Request,
        res: Response<unknown, DetailJenisIuranByIDLocal>,
    ): Promise<void> {
        const { id } = res.locals.validated.params
        const data = await jenisIuranService.getJenisIuranByID(id)
        resHandler.success(res, 200, "Success", data)
    },
    async createJenisIuran(
        _req: Request,
        res: Response<unknown, CreateJenisIuranLocal>,
    ): Promise<void> {
        const { body } = res.locals.validated
        const data = await jenisIuranService.createJenisIuran(body)
        resHandler.success(res, 201, "Success", data)
    },
    async updateJenisIuran(
        _req: Request,
        res: Response<unknown, UpdateJenisIuranLocal>,
    ): Promise<void> {
        const { params, body } = res.locals.validated
        const data = await jenisIuranService.updateJenisIuran(params.id, body)
        resHandler.success(res, 200, "Success", data)
    },
    async deleteJenisIuran(
        _req: Request,
        res: Response<unknown, DetailJenisIuranByIDLocal>,
    ): Promise<void> {
        const { id } = res.locals.validated.params
        const data = await jenisIuranService.deleteJenisIuran(id)
        resHandler.success(res, 200, "Success", data)
    },
}
