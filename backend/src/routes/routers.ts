import {
    getDetailPesertaByIdAndKodeOrganisasiSchema,
    createPesertaSchema,
    getDetailPesertaByIdParamsSchema,
    updatePesertaSchema,
    decryptQRCodeStringSchema,
    generateQrCodePesertaSchema,
    downloadQrCodePesertaSchema,
} from "./../../validator/peserta.validator"
import { pesertaController } from "./../controllers/peserta.controller"
import {
    createUserSchema,
    getDetailUserByIdAndKodeOrganisasiSchema,
    getDetailUserByIdParamsSchema,
    updateUserSchema,
    loginUserSchema,
} from "./../../validator/user.validator"
import { Router } from "express"
import { orgController } from "../controllers/organisasi.controller.ts"
import { validate } from "../middlewares/zod_validator.ts"
import {
    createOrganisasiWithUserSchema,
    organisasiByKodeParamsSchema,
    updateOrganisasiSchema,
} from "../../validator/organisasi.validator.ts"
import { userController } from "../controllers/user.controller.ts"
import { authenticateJWT } from "../middlewares/authentication.ts"

export const router = Router()

router.post("/organisasi", validate(createOrganisasiWithUserSchema, "body"), orgController.create)
router.post("/user/login", validate(loginUserSchema, "body"), userController.loginUser)

/**
 * !PENTING: Jika akan menambahkan route baru tanpa perlu proteksi authentication, letakan diatas router.use("/some-endpoint", authenticateJWT) atau diatas Peringatan ini
 * !         agar tidak terkena proteksi Authentication Middleware. Namun jika route baru tersebut membutuhkan proteksi authentication,
 * !         letakan di bawah router.use("/some-endpoint", authenticateJWT) agar route baru tersebut terkena proteksi Authentication Middleware.
 */

router.use("/organisasi/:kode", authenticateJWT)
router.use("/users/:kode", authenticateJWT)
router.use("/user", authenticateJWT)
router.use("/peserta", authenticateJWT)

router.get(
    "/organisasi/:kode",
    validate(organisasiByKodeParamsSchema, "params"),
    orgController.getByKode,
)

router.patch(
    "/organisasi/:kode",
    validate(organisasiByKodeParamsSchema, "params"),
    validate(updateOrganisasiSchema, "body"),
    orgController.update,
)

router.delete(
    "/organisasi/:kode",
    validate(organisasiByKodeParamsSchema, "params"),
    orgController.deactivate,
)

//USER
router.get(
    "/users/:kode",
    validate(organisasiByKodeParamsSchema, "params"),
    userController.getUserByOrganizationCode,
)
router.get(
    "/user/:id/:kode",
    validate(getDetailUserByIdAndKodeOrganisasiSchema, "params"),
    userController.getDetailUserByOrganizationCode,
)
router.post("/user", validate(createUserSchema, "body"), userController.createUser)
router.patch(
    "/user/:id",
    validate(getDetailUserByIdParamsSchema, "params"),
    validate(updateUserSchema, "body"),
    userController.updateUser,
)

// PESERTA
router.get(
    "/peserta/:kode",
    validate(organisasiByKodeParamsSchema, "params"),
    pesertaController.getPesertaByOrganizationCode,
)
router.get(
    "/peserta/:id/:kode",
    validate(getDetailPesertaByIdAndKodeOrganisasiSchema, "params"),
    pesertaController.getDetailPesertaByOrganizationCode,
)
router.post("/peserta", validate(createPesertaSchema, "body"), pesertaController.createPeserta)
router.patch(
    "/peserta/:id",
    validate(getDetailPesertaByIdParamsSchema, "params"),
    validate(updatePesertaSchema, "body"),
    pesertaController.updatePeserta,
)
router.get(
    "/peserta/qr/decrypt/:qrCodeString",
    validate(decryptQRCodeStringSchema, "params"),
    pesertaController.decryptQRCode,
)
router.get(
    "/peserta/qr/revoke/:id/:kode",
    validate(getDetailPesertaByIdAndKodeOrganisasiSchema, "params"),
    pesertaController.revokeQRCode,
)
router.get(
    "/peserta/qr/generate/:kodePeserta/:kodeOrganisasi",
    validate(generateQrCodePesertaSchema, "params"),
    pesertaController.generateQRCode,
)
router.get(
    "/peserta/qr/download/:qrUrl",
    validate(downloadQrCodePesertaSchema, "params"),
    pesertaController.downloadQRCode,
)
