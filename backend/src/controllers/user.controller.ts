import type { Request, Response } from "express"
import type { OrganisasiByKodeParams } from "../../validator/organisasi.validator"
import { userService } from "../services/user.service"
import { resHandler } from "../utils/response_handler"
import type {
    CreateUserBody,
    GetDetailUserByIdAndKodeOrganisasiParams,
    GetDetailUserByIdParams,
    LoginUserBody,
    UpdateUserBody,
} from "../../validator/user.validator"

type KodeOrgParamsLocals = { validated: { params: OrganisasiByKodeParams } }
type getDetailUserByOrganisasiLocals = {
    validated: { params: GetDetailUserByIdAndKodeOrganisasiParams }
}
type createUserDataLocals = { validated: { body: CreateUserBody } }
type updateUserDataLocals = {
    validated: {
        params: GetDetailUserByIdParams
        body: UpdateUserBody
    }
}
type loginUserDataLocals = { validated: { body: LoginUserBody } }

export const userController = {
    async getUserByOrganizationCode(
        _req: Request,
        res: Response<unknown, KodeOrgParamsLocals>,
    ): Promise<void> {
        const { kode } = res.locals.validated.params

        const users = await userService.getUsersByOrganizationCode(kode)

        if (!users) {
            resHandler.error(res, 404, "Organisasi tidak ditemukan atau tidak aktif")
            return
        }

        resHandler.success(res, 200, "Success", users)
    },

    async getDetailUserByOrganizationCode(
        _req: Request,
        res: Response<unknown, getDetailUserByOrganisasiLocals>,
    ): Promise<void> {
        const { id, kode } = res.locals.validated.params

        const data = await userService.getUserByIdAndOrganizationCode(id, kode)

        if (!data) {
            resHandler.error(res, 404, "User tidak ditemukan atau organisasi tidak aktif")
            return
        }

        resHandler.success(res, 200, "Success", data)
    },

    async createUser(_req: Request, res: Response<unknown, createUserDataLocals>): Promise<void> {
        const user = await userService.createUser(res.locals.validated.body)
        resHandler.success(res, 201, "User berhasil dibuat", user)
    },

    async updateUser(_req: Request, res: Response<unknown, updateUserDataLocals>): Promise<void> {
        const { id } = res.locals.validated.params
        const input = res.locals.validated.body
        const user = await userService.updateUser(id, input)
        if (!user) {
            resHandler.error(res, 404, "User tidak ditemukan")
            return
        }
        resHandler.success(res, 200, "User berhasil diperbarui", user)
    },

    async loginUser(_req: Request, res: Response<unknown, loginUserDataLocals>): Promise<void> {
        const { username, password } = res.locals.validated.body
        const user = await userService.loginUser(username, password)
        if (!user) {
            resHandler.error(res, 401, "Username atau password salah, atau organisasi tidak aktif")
            return
        }
        resHandler.success(res, 200, "Login berhasil", user)
    },
}
