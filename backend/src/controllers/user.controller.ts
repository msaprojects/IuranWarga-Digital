import type { Request, Response } from "express"
import type { OrganisasiByKodeParams } from "../../validator/organisasi.validator.ts"
import { userService } from "../services/user.service.ts"
import { resHandler } from "../utils/response_handler.ts"
import type {
    CreateUserBody,
    GetDetailUserByIdAndKodeOrganisasiParams,
    GetDetailUserByIdParams,
    LoginUserBody,
    UpdateUserBody,
} from "../../validator/user.validator.ts"

type KodeOrgParamsLocals = { validated: { params: OrganisasiByKodeParams } }
type DetailUserLocals = { validated: { params: GetDetailUserByIdAndKodeOrganisasiParams } }
type CreateUserLocals = { validated: { body: CreateUserBody } }
type UpdateUserLocals = {
    validated: {
        params: GetDetailUserByIdParams
        body: UpdateUserBody
    }
}
type LoginUserLocals = { validated: { body: LoginUserBody } }

// Service melempar NotFoundError/UnauthorizedError/ConflictError → handler
// memetakan ke status + envelope. Tidak ada lagi cek null/401 mati di sini.
export const userController = {
    async getUserByOrganizationCode(
        _req: Request,
        res: Response<unknown, KodeOrgParamsLocals>,
    ): Promise<void> {
        const { kode } = res.locals.validated.params
        const users = await userService.getUsersByOrganizationCode(kode)
        resHandler.success(res, 200, "Success", users)
    },

    async getDetailUserByOrganizationCode(
        _req: Request,
        res: Response<unknown, DetailUserLocals>,
    ): Promise<void> {
        const { id, kode } = res.locals.validated.params
        const data = await userService.getUserByIdAndOrganizationCode(id, kode)
        resHandler.success(res, 200, "Success", data)
    },

    async createUser(_req: Request, res: Response<unknown, CreateUserLocals>): Promise<void> {
        const user = await userService.createUser(res.locals.validated.body)
        resHandler.success(res, 201, "User berhasil dibuat", user)
    },

    async updateUser(_req: Request, res: Response<unknown, UpdateUserLocals>): Promise<void> {
        const { id } = res.locals.validated.params
        const input = res.locals.validated.body
        const user = await userService.updateUser(id, input)
        resHandler.success(res, 200, "User berhasil diperbarui", user)
    },

    async loginUser(_req: Request, res: Response<unknown, LoginUserLocals>): Promise<void> {
        const { username, password } = res.locals.validated.body
        const user = await userService.loginUser(username, password)
        resHandler.success(res, 200, "Login berhasil", user)
    },
}
