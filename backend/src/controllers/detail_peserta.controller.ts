import type { Request, Response } from "express"
import { detailPesertaService } from "../services/detail_peserta.service.ts"
import type {
    CreateDataDetailPesertaSchema,
    GetDataDetailPesertaByIDShema,
    GetDetailPesertaByPesertaIDSchema,
    UpdateDataDetailPesertaSchema,
} from "../../validator/detail_peserta.validator.ts"
import { resHandler } from "../utils/response_handler.ts"

type DataDetailPesertaByPesertaIdParams = {
    validated: { params: GetDetailPesertaByPesertaIDSchema }
}
type DataDetailPesertaByIdParams = { validated: { params: GetDataDetailPesertaByIDShema } }
type CreateDataDetailPeserta = { validated: { body: CreateDataDetailPesertaSchema } }
type UpdateDataDetailPeserta = {
    validated: { params: GetDataDetailPesertaByIDShema; body: UpdateDataDetailPesertaSchema }
}

export const DetailPesertaController = {
    async getDataDetailPesertaByIDPeserta(
        _req: Request,
        res: Response<unknown, DataDetailPesertaByPesertaIdParams>,
    ) {
        const { peserta_id } = res.locals.validated.params
        const data = await detailPesertaService.getDetailPesertaByPesertaID(Number(peserta_id))
        resHandler.success(res, 200, "Success", data)
    },
    async getDataDetailPesertaById(
        _req: Request,
        res: Response<unknown, DataDetailPesertaByIdParams>,
    ) {
        const { id } = res.locals.validated.params
        const data = await detailPesertaService.getDetailPesertaById(id)
        resHandler.success(res, 200, "Success", data)
    },
    async createDataDetailPeserta(_req: Request, res: Response<unknown, CreateDataDetailPeserta>) {
        const data = await detailPesertaService.createDetailPeserta(res.locals.validated.body)
        resHandler.success(res, 201, "Success", data)
    },
    async updateDataDetailPeserta(_req: Request, res: Response<unknown, UpdateDataDetailPeserta>) {
        const { id } = res.locals.validated.params
        const detail_peserta = res.locals.validated.body
        const data = await detailPesertaService.updateDataDetailPeserta(
            id,
            detail_peserta,
        )
        resHandler.success(res, 200, "Success", data)
    },
    async deleteDataDetailPeserta(
        _res: Request,
        res: Response<unknown, DataDetailPesertaByIdParams>,
    ) {
        const { id } = res.locals.validated.params
        const data = await detailPesertaService.deleteDataDetailPeserta(id)
        resHandler.success(res, 200, "Success", data)
    },
}
