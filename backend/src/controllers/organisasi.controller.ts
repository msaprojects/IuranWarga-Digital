import type {Request, Response} from 'express'
import {OrganisasiService} from "../services/organisasi.service.ts";

export class organisasiController {
    async getOrganisasiByKodeController(req: Request, res: Response) {
        const {kode} = req.params
        try {

            const data = await OrganisasiService
        } catch (error) {

        }
    }
}