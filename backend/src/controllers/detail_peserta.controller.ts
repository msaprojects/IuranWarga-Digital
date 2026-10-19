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
type UpdateDataDetailPeserta = { validated: { body: UpdateDataDetailPesertaSchema } }

export const DetailPesertaController = {
    async getDataDetailPesertaByIDPeserta(
        req: Request,
        res: Response<unknown, DataDetailPesertaByPesertaIdParams>,
    ) {
        const { peserta_id } = res.locals.validated.params
        const data = await detailPesertaService.getDetailPesertaByPesertaID(Number(peserta_id))
        resHandler.success(res, 200, "Success", data)
    },
    async getDataDetailPesertaById(
        req: Request,
        res: Response<unknown, DataDetailPesertaByIdParams>,
    ) {
        const { id } = res.locals.validated.params
        const data = await detailPesertaService.getDetailPesertaById(id)
        resHandler.success(res, 200, "Success", data)
    },
    async createDataDetailPeserta(req: Request, res: Response<unknown, CreateDataDetailPeserta>) {
        const data = await detailPesertaService.createDetailPeserta(res.locals.validated.body)
        resHandler.success(res, 200, "Success", data)
    },
}
