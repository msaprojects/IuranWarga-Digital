import type { Request, Response } from "express";
import { orgService } from "../services/organisasi.service.ts";
import { resHandler } from "../utils/response_handler.ts";
import type {
    CreateOrganisasiWithUserBody,
    OrganisasiByKodeParams,
    UpdateOrganisasiBody,
} from "../../validator/organisasi.validator.ts";

type ParamsLocals = { validated: { params: OrganisasiByKodeParams } };
type CreateLocals = { validated: { body: CreateOrganisasiWithUserBody } };
type UpdateLocals = {
    validated: {
        params: OrganisasiByKodeParams;
        body: UpdateOrganisasiBody;
    };
};

export const orgController = {
    async getByKode(_req: Request, res: Response<unknown, ParamsLocals>): Promise<void> {
        const { kode } = res.locals.validated.params;
        const organisasi = await orgService.getByKode(kode);

        if (!organisasi) {
            resHandler.error(res, 404, "Organisasi tidak ditemukan");
            return;
        }

        resHandler.success(res, 200, "Success", organisasi);
    },

    async create(_req: Request, res: Response<unknown, CreateLocals>): Promise<void> {
        const organisasi = await orgService.create(res.locals.validated.body);
        resHandler.success(res, 201, "Organisasi berhasil dibuat", organisasi);
    },

    async update(_req: Request, res: Response<unknown, UpdateLocals>): Promise<void> {
        const { kode } = res.locals.validated.params;
        const input = res.locals.validated.body;
        const organisasi = await orgService.updateByKode(kode, input);

        if (!organisasi) {
            resHandler.error(res, 404, "Organisasi tidak ditemukan");
            return;
        }

        resHandler.success(res, 200, "Organisasi berhasil diperbarui", organisasi);
    },

    async deactivate(_req: Request, res: Response<unknown, ParamsLocals>): Promise<void> {
        const { kode } = res.locals.validated.params;
        const organisasi = await orgService.deactivateByKode(kode);

        if (!organisasi) {
            resHandler.error(res, 404, "Organisasi tidak ditemukan atau sudah nonaktif");
            return;
        }

        resHandler.success(res, 200, "Organisasi berhasil dinonaktifkan", organisasi);
    },
};
