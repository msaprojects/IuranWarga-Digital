import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals"
import request from "supertest"
import app from "../src/app.ts"
import { jenisIuranService } from "../src/services/jenis_iuran.service.ts"
import { HttpError } from "../src/utils/http_error.ts"
import { authorizationHeader } from "./auth.ts"

const jenisIuran = {
    id: 1,
    judul: "Iuran Kebersihan",
    periode_iuran: "BULANAN",
    nominal: "50000",
    tanggal_awal: "2026-01-01T00:00:00.000Z",
    tanggal_akhir: "2026-12-31T00:00:00.000Z",
    isActive: true,
    organisasi_id: 1,
    createdAt: "2026-10-16T00:00:00.000Z",
    updatedAt: "2026-10-16T00:00:00.000Z",
}

const createPayload = {
    judul: "Iuran Keamanan",
    periode_iuran: "BULANAN",
    jenis_peserta: "RUMAH",
    nominal: "75000",
    tanggal_awal: "2026-01-01",
    tanggal_akhir: "2026-12-31",
    organisasi_id: 1,
}

describe("Jenis Iuran API", () => {
    beforeEach(() => {
        jest.spyOn(jenisIuranService, "getJenisIuranByKodeOrganisasi").mockResolvedValue([
            jenisIuran,
        ] as never)
        jest.spyOn(jenisIuranService, "getJenisIuranByID").mockResolvedValue(jenisIuran as never)
        jest.spyOn(jenisIuranService, "createJenisIuran").mockResolvedValue(jenisIuran as never)
        jest.spyOn(jenisIuranService, "updateJenisIuran").mockResolvedValue(jenisIuran as never)
        jest.spyOn(jenisIuranService, "deleteJenisIuran").mockResolvedValue(jenisIuran as never)
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it("menyediakan dokumentasi OpenAPI untuk endpoint jenis iuran", async () => {
        const response = await request(app).get("/api-docs.json")

        expect(response.status).toBe(200)
        expect(response.body.paths["/jenis-iuran"].post).toBeDefined()
        expect(response.body.paths["/jenis-iuran/{id}"].get).toBeDefined()
        expect(response.body.paths["/jenis-iuran/{id}"].patch).toBeDefined()
        expect(response.body.paths["/jenis-iuran/{id}"].delete).toBeDefined()
        expect(response.body.paths["/jenis-iuran/organisasi/{kode}"].get).toBeDefined()
        expect(
            response.body.paths["/jenis-iuran"].post.requestBody.content["application/json"].schema
                .$ref,
        ).toBe("#/components/schemas/CreateJenisIuranInput")
        expect(response.body.components.schemas.CreateJenisIuranInput.required).toEqual([
            "judul",
            "periode_iuran",
            "nominal",
            "tanggal_awal",
            "tanggal_akhir",
            "organisasi_id",
        ])
    })

    describe(" Proteksi autentikasi", () => {
        it("mengembalikan 401 tanpa token", async () => {
            const response = await request(app).get("/api/jenis-iuran/1")

            expect(response.status).toBe(401)
            expect(response.body.message).toBe("Token autentikasi tidak ditemukan.")
            expect(jenisIuranService.getJenisIuranByID).not.toHaveBeenCalled()
        })
    })

    describe("GET /jenis-iuran/organisasi/:kode", () => {
        it("mengembalikan daftar jenis iuran untuk kode organisasi valid", async () => {
            const response = await request(app)
                .get("/api/jenis-iuran/organisasi/ORG001")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(200)
            expect(response.body).toEqual({
                status: "success",
                message: "Success",
                data: [expect.objectContaining({ id: 1, organisasi_id: 1 })],
            })
            expect(jenisIuranService.getJenisIuranByKodeOrganisasi).toHaveBeenCalledWith("ORG001")
        })

        it("mengembalikan 400 untuk kode yang tidak valid", async () => {
            const response = await request(app)
                .get("/api/jenis-iuran/organisasi/!")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(400)
            expect(response.body.message).toBe("Validation Error")
            expect(jenisIuranService.getJenisIuranByKodeOrganisasi).not.toHaveBeenCalled()
        })
    })

    describe("GET /jenis-iuran/:id", () => {
        it("mengembalikan detail jenis iuran berdasarkan id", async () => {
            const response = await request(app)
                .get("/api/jenis-iuran/1")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(200)
            expect(response.body.data).toEqual(expect.objectContaining({ id: 1 }))
            expect(jenisIuranService.getJenisIuranByID).toHaveBeenCalledWith(1)
        })

        it("mengembalikan 400 untuk id yang bukan bilangan bulat positif", async () => {
            const response = await request(app)
                .get("/api/jenis-iuran/abc")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(400)
            expect(jenisIuranService.getJenisIuranByID).not.toHaveBeenCalled()
        })

        it("mengembalikan 404 jika jenis iuran tidak ditemukan", async () => {
            jest.spyOn(jenisIuranService, "getJenisIuranByID").mockRejectedValue(
                new HttpError(404, "Jenis iuran tidak ditemukan."),
            )

            const response = await request(app)
                .get("/api/jenis-iuran/99")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(404)
            expect(response.body).toEqual({
                status: "failed",
                message: "Jenis iuran tidak ditemukan.",
            })
        })
    })

    describe("POST /jenis-iuran", () => {
        it("membuat jenis iuran dengan body valid", async () => {
            const response = await request(app)
                .post("/api/jenis-iuran")
                .set("Authorization", authorizationHeader())
                .send(createPayload)

            expect(response.status).toBe(201)
            expect(response.body).toEqual({
                status: "success",
                message: "Success",
                data: expect.objectContaining({ id: 1, judul: "Iuran Kebersihan" }),
            })
            expect(jenisIuranService.createJenisIuran).toHaveBeenCalledWith(
                expect.objectContaining({
                    judul: "Iuran Keamanan",
                    periode_iuran: "BULANAN",
                    jenis_peserta: "RUMAH",
                    nominal: "75000",
                    organisasi_id: 1,
                    isActive: true,
                }),
            )
        })

        it("menolak body dengan periode_iuran tidak valid", async () => {
            const response = await request(app)
                .post("/api/jenis-iuran")
                .set("Authorization", authorizationHeader())
                .send({ ...createPayload, periode_iuran: "TIGA_BULANAN" })

            expect(response.status).toBe(400)
            expect(response.body.message).toBe("Validation Error")
            expect(jenisIuranService.createJenisIuran).not.toHaveBeenCalled()
        })

        it("menolak nominal yang bukan string angka positif", async () => {
            const response = await request(app)
                .post("/api/jenis-iuran")
                .set("Authorization", authorizationHeader())
                .send({ ...createPayload, nominal: "abc" })

            expect(response.status).toBe(400)
            expect(response.body.message).toBe("Validation Error")
            expect(jenisIuranService.createJenisIuran).not.toHaveBeenCalled()
        })

        it("menolak field tidak dikenal (strict object)", async () => {
            const response = await request(app)
                .post("/api/jenis-iuran")
                .set("Authorization", authorizationHeader())
                .send({ ...createPayload, unknownField: true })

            expect(response.status).toBe(400)
            expect(jenisIuranService.createJenisIuran).not.toHaveBeenCalled()
        })

        it("mengembalikan 404 jika organisasi tujuan tidak ditemukan", async () => {
            jest.spyOn(jenisIuranService, "createJenisIuran").mockRejectedValue(
                new HttpError(404, "Organisasi tidak ditemukan / sudah tidak aktif"),
            )

            const response = await request(app)
                .post("/api/jenis-iuran")
                .set("Authorization", authorizationHeader())
                .send(createPayload)

            expect(response.status).toBe(404)
            expect(response.body).toEqual({
                status: "failed",
                message: "Organisasi tidak ditemukan / sudah tidak aktif",
            })
        })
    })

    describe("PATCH /jenis-iuran/:id", () => {
        it("memperbarui jenis iuran berdasarkan id", async () => {
            const response = await request(app)
                .patch("/api/jenis-iuran/1")
                .set("Authorization", authorizationHeader())
                .send({ judul: "Iuran Sampah" })

            expect(response.status).toBe(200)
            expect(response.body.data).toEqual(expect.objectContaining({ id: 1 }))
            expect(jenisIuranService.updateJenisIuran).toHaveBeenCalledWith(1, {
                judul: "Iuran Sampah",
            })
        })

        it("mengembalikan 400 untuk id path yang tidak valid", async () => {
            const response = await request(app)
                .patch("/api/jenis-iuran/0")
                .set("Authorization", authorizationHeader())
                .send({ judul: "Iuran Sampah" })

            expect(response.status).toBe(400)
            expect(response.body.message).toBe("Validation Error")
            expect(jenisIuranService.updateJenisIuran).not.toHaveBeenCalled()
        })

        it("mengembalikan 400 untuk body yang tidak valid", async () => {
            const response = await request(app)
                .patch("/api/jenis-iuran/1")
                .set("Authorization", authorizationHeader())
                .send({ judul: "x" })

            expect(response.status).toBe(400)
            expect(jenisIuranService.updateJenisIuran).not.toHaveBeenCalled()
        })

        it("mengembalikan 404 jika jenis iuran tidak ditemukan saat update", async () => {
            jest.spyOn(jenisIuranService, "updateJenisIuran").mockRejectedValue(
                new HttpError(404, "Jenis Iuran Tidak Aktif"),
            )

            const response = await request(app)
                .patch("/api/jenis-iuran/99")
                .set("Authorization", authorizationHeader())
                .send({ judul: "Iuran Sampah" })

            expect(response.status).toBe(404)
            expect(response.body).toEqual({ status: "failed", message: "Jenis Iuran Tidak Aktif" })
        })
    })

    describe("DELETE /jenis-iuran/:id", () => {
        it("menghapus jenis iuran berdasarkan id", async () => {
            const response = await request(app)
                .delete("/api/jenis-iuran/1")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(200)
            expect(response.body.data).toEqual(expect.objectContaining({ id: 1 }))
            expect(jenisIuranService.deleteJenisIuran).toHaveBeenCalledWith(1)
        })

        it("mengembalikan 400 untuk id yang tidak valid", async () => {
            const response = await request(app)
                .delete("/api/jenis-iuran/abc")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(400)
            expect(jenisIuranService.deleteJenisIuran).not.toHaveBeenCalled()
        })

        it("mengembalikan 404 jika jenis iuran tidak ditemukan saat hapus", async () => {
            jest.spyOn(jenisIuranService, "deleteJenisIuran").mockRejectedValue(
                new HttpError(404, "Data Not Found"),
            )

            const response = await request(app)
                .delete("/api/jenis-iuran/99")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(404)
            expect(response.body).toEqual({ status: "failed", message: "Data Not Found" })
        })
    })
})
