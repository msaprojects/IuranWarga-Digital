import { resHandler } from "./../utils/response_handler";
import { pesertaService } from "./../services/peserta.service";
import type {
    GetDetailPesertaByIdAndKodeOrganisasiParams,
    GetDetailPesertaByIdParams,
    CreatePesertaBody,
    UpdatePesertaBody,
    DecryptQRCodeStringBody,
} from "./../../validator/peserta.validator";
import type { OrganisasiByKodeParams } from "./../../validator/organisasi.validator";
import type { Response, Request } from "express";

type KodeOrgParamsLocals = { validated: { params: OrganisasiByKodeParams } };
type getDetailPesertaByOrganisasiLocals = {
    validated: { params: GetDetailPesertaByIdAndKodeOrganisasiParams };
};
type createPesertaDataLocals = { validated: { body: CreatePesertaBody } };
type updatePesertaDataLocals = {
    validated: {
        params: GetDetailPesertaByIdParams;
        body: UpdatePesertaBody;
    };
};
type decryptQRCodeLocals = {
    validated: {
        params: DecryptQRCodeStringBody;
    };
};

export const pesertaController = {
    // find data peserta by organization code
    async getPesertaByOrganizationCode(
        _req: Request,
        res: Response<unknown, KodeOrgParamsLocals>,
    ): Promise<void> {
        const { kode } = res.locals.validated.params;

        const peserta = await pesertaService.getAllPesertaByOrganizationCode(kode);
        if (!peserta) {
            resHandler.error(res, 404, "Organisasi tidak ditemukan atau tidak aktif");
            return;
        }

        resHandler.success(res, 200, "Success", peserta);
    },

    // get detail peserta by organization code and peserta id
    async getDetailPesertaByOrganizationCode(
        _req: Request,
        res: Response<unknown, getDetailPesertaByOrganisasiLocals>,
    ): Promise<void> {
        const { id, kode } = res.locals.validated.params;
        const peserta = await pesertaService.getPesertaByIdAndOrganizationCode(id, kode);
        if (!peserta) {
            resHandler.error(res, 404, "Peserta tidak ditemukan atau organisasi tidak aktif");
            return;
        }
        resHandler.success(res, 200, "Success", peserta);
    },

    // create peserta
    async createPeserta(
        _req: Request,
        res: Response<unknown, createPesertaDataLocals>,
    ): Promise<void> {
        const peserta = await pesertaService.createPeserta(res.locals.validated.body);
        resHandler.success(res, 201, "Peserta berhasil dibuat", peserta);
    },

    // update peserta
    async updatePeserta(
        _req: Request,
        res: Response<unknown, updatePesertaDataLocals>,
    ): Promise<void> {
        const { id } = res.locals.validated.params;
        const input = res.locals.validated.body;
        const peserta = await pesertaService.updatePeserta(id, input);
        resHandler.success(res, 200, "Peserta berhasil diperbarui", peserta);
    },

    // revoke qr code make qr_token null in peserta table
    async revokeQRCode(
        _req: Request,
        res: Response<unknown, getDetailPesertaByOrganisasiLocals>,
    ): Promise<void> {
        const { id, kode } = res.locals.validated.params;
        const peserta = await pesertaService.revokeQRCode(id, kode);
        resHandler.success(res, 200, "QR Code berhasil dicabut", peserta);
    },

    // generate qrcode token for peserta by organization code and peserta id
    async generateQRCode(
        _req: Request,
        res: Response<unknown, getDetailPesertaByOrganisasiLocals>,
    ): Promise<void> {
        const { id, kode } = res.locals.validated.params;
        const peserta = await pesertaService.generateQrCode(kode, String(id));
        resHandler.success(res, 200, "QR Code berhasil digenerate", peserta);
    },

    // decrypt qr code string to extract peserta detail data
    async decryptQRCode(_req: Request, res: Response<unknown, decryptQRCodeLocals>): Promise<void> {
        const { qrCodeString } = res.locals.validated.params;
        const peserta = await pesertaService.decryptQrCode(qrCodeString);
        resHandler.success(res, 200, "QR Code berhasil didecrypt", peserta);
    },
};
