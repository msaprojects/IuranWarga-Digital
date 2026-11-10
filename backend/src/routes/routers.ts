import {
    getDetailPesertaByIdAndKodeOrganisasiSchema,
    createPesertaSchema,
    pesertaIdSchema,
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
import {
    createDetailPesertaSchema,
    detailPesertaIdSchema,
    getDetailPesertaByPesertaIdSchema,
    updateDetailPesertaSchema,
} from "../../validator/detail_peserta.validator.ts"
import { DetailPesertaController } from "../controllers/detail_peserta.controller.ts"
import {
    createJenisIuranSchema,
    detailJenisIuranIDSchema,
    updateJenisIuranSchema,
} from "../../validator/jenis_iuran.validator.ts"
import { jenisIuranController } from "../controllers/jenis_iuran.controller.ts"
import {
    createTagihanIuranSchema,
    deleteTagihanIuranSchema,
    getAllTagihanIuranSchema,
    tagihanIuranIdSchema,
    updateTagihanIuranSchema,
} from "../../validator/tagihan_iuran.validator.ts"
import { tagihanIuranController } from "../controllers/tagihan_iuran.controller.ts"
import { requireTenant } from "../middlewares/tenant.ts"

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
router.use("/detail-peserta-by-peserta/:peserta_id", authenticateJWT)
router.use("/detail-peserta", authenticateJWT)
router.use("/jenis-iuran", authenticateJWT)
router.use("/tagihan-iuran", authenticateJWT)

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
router.post(
    "/peserta",
    validate(createPesertaSchema, "body"),
    requireTenant(),
    pesertaController.createPeserta,
)
router.patch(
    "/peserta/:id",
    validate(pesertaIdSchema, "params"),
    validate(updatePesertaSchema, "body"),
    requireTenant(),
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

// DETAIL PESERTA
// `detail_peserta` tidak punya kolom `organisasi_id`; guard tetap dipasang
// supaya tenant terverifikasi tersedia di `res.locals.tenant` untuk dipakai
// service saat menelusuri peserta induk.
router.get(
    "/detail-peserta-by-peserta/:peserta_id",
    validate(getDetailPesertaByPesertaIdSchema, "params"),
    requireTenant(),
    DetailPesertaController.listByPeserta,
)
router.get(
    "/detail-peserta/:id",
    validate(detailPesertaIdSchema, "params"),
    requireTenant(),
    DetailPesertaController.getById,
)
router.post(
    "/detail-peserta",
    validate(createDetailPesertaSchema, "body"),
    requireTenant(),
    DetailPesertaController.create,
)
router.patch(
    "/detail-peserta/:id",
    validate(detailPesertaIdSchema, "params"),
    validate(updateDetailPesertaSchema, "body"),
    requireTenant(),
    DetailPesertaController.update,
)
router.delete(
    "/detail-peserta/:id",
    validate(detailPesertaIdSchema, "params"),
    requireTenant(),
    DetailPesertaController.delete,
)

// JENIS IURAN
// Route berbasis kode mencocokkan `:kode` dengan `orgKode` di token; route
// berbasis id/scoped lewat `organisasi_id` token seperti grup lainnya.
router.get(
    "/jenis-iuran/organisasi/:kode",
    validate(organisasiByKodeParamsSchema, "params"),
    requireTenant({ kode: "kode" }),
    jenisIuranController.getJenisIuranByOrganisasi,
)
router.get(
    "/jenis-iuran/:id",
    validate(detailJenisIuranIDSchema, "params"),
    requireTenant(),
    jenisIuranController.getDetailJenisIuranByID,
)
router.post(
    "/jenis-iuran",
    validate(createJenisIuranSchema, "body"),
    requireTenant(),
    jenisIuranController.createJenisIuran,
)
router.patch(
    "/jenis-iuran/:id",
    validate(detailJenisIuranIDSchema, "params"),
    validate(updateJenisIuranSchema, "body"),
    requireTenant(),
    jenisIuranController.updateJenisIuran,
)
router.delete(
    "/jenis-iuran/:id",
    validate(detailJenisIuranIDSchema, "params"),
    requireTenant(),
    jenisIuranController.deleteJenisIuran,
)

// TAGIHAN IURAN
router.get(
    "/tagihan-iuran/organisasi/:organisasi_id",
    validate(getAllTagihanIuranSchema, "params"),
    requireTenant(),
    tagihanIuranController.getAllByOrganisasi,
)
router.post(
    "/tagihan-iuran",
    validate(createTagihanIuranSchema, "body"),
    requireTenant(),
    tagihanIuranController.createTagihanIuran,
)
router.patch(
    "/tagihan-iuran/:id",
    validate(tagihanIuranIdSchema, "params"),
    validate(updateTagihanIuranSchema, "body"),
    requireTenant(),
    tagihanIuranController.updateTagihanIuran,
)
router.delete(
    "/tagihan-iuran/:id",
    validate(tagihanIuranIdSchema, "params"),
    validate(deleteTagihanIuranSchema, "body"),
    requireTenant(),
    tagihanIuranController.deleteTagihanIuran,
)
