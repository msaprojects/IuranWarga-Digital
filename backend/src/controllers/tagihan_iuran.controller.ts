import type { Request, Response } from "express"
import type {
    GetAllTagihanIuranParams,
    TagihanIuranIdParams,
    CreateTagihanIuranBody,
    UpdateTagihanIuranBody,
    DeleteTagihanIuranBody,
} from "../../validator/tagihan_iuran.validator.ts"
import { tagihanIuranService } from "../services/tagihan_iuran.ts"
import { resHandler } from "../utils/response_handler.ts"

type AuthenticatedUser = { userId: number }

export type GetAllTagihanIuranLocal = { validated: { params: GetAllTagihanIuranParams } }
export type DetailTagihanIuranByIDLocal = { validated: { params: TagihanIuranIdParams } }
export type CreateTagihanIuranLocal = { validated: { body: CreateTagihanIuranBody } }
export type UpdateTagihanIuranLocal = {
    validated: { params: TagihanIuranIdParams; body: UpdateTagihanIuranBody }
}
export type DeleteTagihanIuranLocal = {
    user: AuthenticatedUser
    validated: { params: TagihanIuranIdParams; body: DeleteTagihanIuranBody }
}

export const tagihanIuranController = {
    async getAllByOrganisasi(
        _req: Request,
        res: Response<unknown, GetAllTagihanIuranLocal>,
    ): Promise<void> {
        const { organisasi_id } = res.locals.validated.params

        const data = await tagihanIuranService.getAll(organisasi_id)
        resHandler.success(res, 200, "Success", data)
    },
    async createTagihanIuran(
        _req: Request,
        res: Response<unknown, CreateTagihanIuranLocal>,
    ): Promise<void> {
        const { body } = res.locals.validated
        const data = await tagihanIuranService.create(body)
        resHandler.success(res, 201, "Success", data)
    },
    async updateTagihanIuran(
        _req: Request,
        res: Response<unknown, UpdateTagihanIuranLocal>,
    ): Promise<void> {
        const { params, body } = res.locals.validated
        const data = await tagihanIuranService.update(params.id, body)
        resHandler.success(res, 200, "Success", data)
    },
    async deleteTagihanIuran(
        _req: Request,
        res: Response<unknown, DeleteTagihanIuranLocal>,
    ): Promise<void> {
        const { params, body } = res.locals.validated
        const { userId } = res.locals.user
        const data = await tagihanIuranService.delete(params.id, userId, body.deleted_reason)
        resHandler.success(res, 200, "Success", data)
    },
}
