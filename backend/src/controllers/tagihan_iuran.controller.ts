import type { Request, Response } from "express"
import type { OrganisasiByKodeParams } from "../../validator/organisasi.validator.ts"
import type { TagihanIdParams, CreateTagihanBody } from "../../validator/tagihan_iuran.validator.ts"
import { tagihanIuranService } from "../services/tagihan_iuran.service.ts"
import { resHandler } from "../utils/response_handler.ts"

// Payload JWT yang dipasang `authenticateJWT` di `res.locals.user`.
type AuthUser = { userId: number; orgId: number; orgKode: string; username: string }

type CreateTagihanLocals = { validated: { body: CreateTagihanBody }; user: AuthUser }
type TagihanIdLocals = { validated: { params: TagihanIdParams } }
type OrganisasiKodeLocals = { validated: { params: OrganisasiByKodeParams } }

export const tagihanController = {
    /**
     * Penerbitan manual. Idempoten terhadap (peserta, jenis_iuran, periode):
     * menerbitkan periode yang sama dua kali tidak menghasilkan duplikat, cukup no-op.
     */
    async createTagihan(_req: Request, res: Response<unknown, CreateTagihanLocals>): Promise<void> {
        const { body } = res.locals.validated
        const user = res.locals.user

        const data = await tagihanIuranService.issueTagihan({
            jenis_iuran_id: body.jenis_iuran_id,
            periode: body.periode,
            peserta_ids: body.peserta_ids,
            keterangan: body.keterangan ?? null,
            source: "MANUAL",
            issued_by: user.userId,
            caller_organisasi_id: user.orgId,
        })

        resHandler.success(res, 201, "Tagihan berhasil diterbitkan.", data)
    },

    async getTagihanById(
        _req: Request,
        res: Response<unknown, TagihanIdLocals>,
    ): Promise<void> {
        const { id } = res.locals.validated.params
        const data = await tagihanIuranService.getById(id)
        resHandler.success(res, 200, "Success", data)
    },

    async getTagihanByOrganisasi(
        _req: Request,
        res: Response<unknown, OrganisasiKodeLocals>,
    ): Promise<void> {
        const { kode } = res.locals.validated.params
        const data = await tagihanIuranService.listByOrganisasiKode(kode)
        resHandler.success(res, 200, "Success", data)
    },
}
