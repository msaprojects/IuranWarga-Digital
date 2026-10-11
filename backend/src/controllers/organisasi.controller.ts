import type { Request, Response } from "express";
import { orgService } from "../services/organisasi.service.ts";
import { resHandler } from "../utils/response_handler.ts";

type GetByKodeLocals = {
  validated: {
    kode: string;
  };
};

export const orgController = {
  async getByKode(
    _req: Request,
    res: Response<unknown, GetByKodeLocals>
  ): Promise<void> {
    const { kode } = res.locals.validated;
    const organisasi = await orgService.getByKode(kode);

    if (!organisasi) {
      resHandler.error(res, 404, "Organisasi tidak ditemukan");
      return;
    }

    resHandler.success(res, 200, "Success", organisasi);
  },
};
