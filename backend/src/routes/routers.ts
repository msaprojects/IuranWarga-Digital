import { Router } from "express";
import { orgController } from "../controllers/organisasi.controller.ts";
import { validate } from "../middlewares/zod_validator.ts";
import { organisasiByKodeParamsSchema } from "../../validator/organisasi.validator.ts";

export const router = Router();

router.get(
  "/organisasi/:kode",
  validate(organisasiByKodeParamsSchema, "params"),
  orgController.getByKode
);