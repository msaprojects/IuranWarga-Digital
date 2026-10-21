import type { Request, Response } from "express"
import { detailPesertaService } from "../services/detail_peserta.service.ts"
import type {
    CreateDetailPesertaBody,
    DetailPesertaIdParams,
    GetDetailPesertaByPesertaIdParams,
    UpdateDetailPesertaBody,
} from "../../validator/detail_peserta.validator.ts"
import { resHandler } from "../utils/response_handler.ts"

type ByPesertaIdLocals = { validated: { params: GetDetailPesertaByPesertaIdParams } }
type ByIdLocals = { validated: { params: DetailPesertaIdParams } }
type CreateLocals = { validated: { body: CreateDetailPesertaBody } }
type UpdateLocals = {
    validated: { params: DetailPesertaIdParams; body: UpdateDetailPesertaBody }
}

export const DetailPesertaController = {
    async listByPeserta(_req: Request, res: Response<unknown, ByPesertaIdLocals>) {
        const { peserta_id } = res.locals.validated.params
        const data = await detailPesertaService.listByPesertaId(peserta_id)
        resHandler.success(res, 200, "Success", data)
    },
    async getById(_req: Request, res: Response<unknown, ByIdLocals>) {
        const { id } = res.locals.validated.params
        const data = await detailPesertaService.getById(id)
        resHandler.success(res, 200, "Success", data)
    },
    async create(_req: Request, res: Response<unknown, CreateLocals>) {
        const data = await detailPesertaService.create(res.locals.validated.body)
        resHandler.success(res, 201, "Detail peserta berhasil dibuat", data)
    },
    async update(_req: Request, res: Response<unknown, UpdateLocals>) {
        const { id } = res.locals.validated.params
        const data = await detailPesertaService.update(id, res.locals.validated.body)
        resHandler.success(res, 200, "Detail peserta berhasil diperbarui", data)
    },
    async delete(_req: Request, res: Response<unknown, ByIdLocals>) {
        const { id } = res.locals.validated.params
        const data = await detailPesertaService.delete(id)
        resHandler.success(res, 200, "Detail peserta berhasil dihapus", data)
    },
}
