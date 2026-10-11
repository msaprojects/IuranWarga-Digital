import { Router } from "express";
import { orgController } from "../controllers/organisasi.controller.ts";
import { validate } from "../middlewares/zod_validator.ts";
import {
    createOrganisasiSchema,
    organisasiByKodeParamsSchema,
    updateOrganisasiSchema,
} from "../../validator/organisasi.validator.ts";

export const router = Router();

router.post("/organisasi", validate(createOrganisasiSchema, "body"), orgController.create);

router.get(
    "/organisasi/:kode",
    validate(organisasiByKodeParamsSchema, "params"),
    orgController.getByKode,
);

router.patch(
    "/organisasi/:kode",
    validate(organisasiByKodeParamsSchema, "params"),
    validate(updateOrganisasiSchema, "body"),
    orgController.update,
);

router.delete(
    "/organisasi/:kode",
    validate(organisasiByKodeParamsSchema, "params"),
    orgController.deactivate,
);
