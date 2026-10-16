import { createUserSchema, getDetailUserByIdAndKodeOrganisasiSchema, getDetailUserByIdParamsSchema, updateUserSchema } from './../../validator/user.validator';
import { Router } from "express";
import { orgController } from "../controllers/organisasi.controller.ts";
import { validate } from "../middlewares/zod_validator.ts";
import {
    createOrganisasiWithUserSchema,
    organisasiByKodeParamsSchema,
    updateOrganisasiSchema,
} from "../../validator/organisasi.validator.ts";
import { userController } from "../controllers/user.controller.ts";

export const router = Router();

router.post(
    "/organisasi",
    validate(createOrganisasiWithUserSchema, "body"),
    orgController.create,
);

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

//USER
router.get('/users/:kode', validate(organisasiByKodeParamsSchema, 'params'), userController.getUserByOrganizationCode);
router.get('/user/:id/:kode', validate(getDetailUserByIdAndKodeOrganisasiSchema, 'params'), userController.getDetailUserByOrganizationCode);
router.post('/user', validate(createUserSchema, 'body'), userController.createUser);
router.patch('/user/:id', validate(getDetailUserByIdParamsSchema, 'params'), validate(updateUserSchema, 'body'), userController.updateUser);