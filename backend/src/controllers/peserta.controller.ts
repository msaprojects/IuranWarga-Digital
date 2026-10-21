import { resHandler } from "../utils/response_handler.ts"
import { pesertaService } from "../services/peserta.service.ts"
import type {
    CreatePesertaBody,
    DecryptQRCodeStringBody,
    DownloadQrCodePesertaBody,
    GenerateQrCodePesertaBody,
    GetDetailPesertaByIdAndKodeOrganisasiParams,
    PesertaIdParams,
    UpdatePesertaBody,
} from "../../validator/peserta.validator.ts"
import type { OrganisasiByKodeParams } from "../../validator/organisasi.validator.ts"
import type { Request, Response } from "express"

type KodeOrgParamsLocals = { validated: { params: OrganisasiByKodeParams } }
type DetailPesertaByOrgLocals = {
    validated: { params: GetDetailPesertaByIdAndKodeOrganisasiParams }
}
type CreatePesertaLocals = { validated: { body: CreatePesertaBody } }
type UpdatePesertaLocals = {
    validated: { params: PesertaIdParams; body: UpdatePesertaBody }
}
type DecryptQrLocals = { validated: { params: DecryptQRCodeStringBody } }
type GenerateQrLocals = { validated: { params: GenerateQrCodePesertaBody } }
type DownloadQrLocals = { validated: { params: DownloadQrCodePesertaBody } }

export const pesertaController = {
    async getPesertaByOrganizationCode(
        _req: Request,
        res: Response<unknown, KodeOrgParamsLocals>,
    ): Promise<void> {
        const { kode } = res.locals.validated.params
        // Service akan throw 404 bila organisasi tidak ada / tidak aktif.
        const data = await pesertaService.getAllPesertaByOrganizationCode(kode)
        resHandler.success(res, 200, "Success", data)
    },

    async getDetailPesertaByOrganizationCode(
        _req: Request,
        res: Response<unknown, DetailPesertaByOrgLocals>,
    ): Promise<void> {
        const { id, kode } = res.locals.validated.params
        // Service akan throw 404 untuk peserta atau organisasi yang tidak ada.
        const data = await pesertaService.getPesertaByIdAndOrganizationCode(id, kode)
        resHandler.success(res, 200, "Success", data)
    },

    async createPeserta(_req: Request, res: Response<unknown, CreatePesertaLocals>): Promise<void> {
        const data = await pesertaService.createPeserta(res.locals.validated.body)
        resHandler.success(res, 201, "Peserta berhasil dibuat", data)
    },

    async updatePeserta(_req: Request, res: Response<unknown, UpdatePesertaLocals>): Promise<void> {
        const { id } = res.locals.validated.params
        const data = await pesertaService.updatePeserta(id, res.locals.validated.body)
        resHandler.success(res, 200, "Peserta berhasil diperbarui", data)
    },

    async revokeQRCode(
        _req: Request,
        res: Response<unknown, DetailPesertaByOrgLocals>,
    ): Promise<void> {
        const { id, kode } = res.locals.validated.params
        const data = await pesertaService.revokeQRCode(id, kode)
        resHandler.success(res, 200, "QR Code berhasil dicabut", data)
    },

    async generateQRCode(_req: Request, res: Response<unknown, GenerateQrLocals>): Promise<void> {
        const { kodePeserta, kodeOrganisasi } = res.locals.validated.params
        const data = await pesertaService.generateQrCode(kodePeserta, kodeOrganisasi)
        resHandler.success(res, 200, "QR Code berhasil digenerate", data)
    },

    async decryptQRCode(_req: Request, res: Response<unknown, DecryptQrLocals>): Promise<void> {
        const { qrCodeString } = res.locals.validated.params
        const data = await pesertaService.decryptQrCode(qrCodeString)
        resHandler.success(res, 200, "QR Code berhasil didecrypt", data)
    },

    async downloadQRCode(_req: Request, res: Response<unknown, DownloadQrLocals>): Promise<void> {
        const { qrUrl } = res.locals.validated.params
        const data = await pesertaService.downloadQrCode(qrUrl)
        resHandler.success(res, 200, "QR Code berhasil didownload", data)
    },
}
