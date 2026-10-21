import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals"
import request from "supertest"
import app from "../src/app.ts"
import { detailPesertaService } from "../src/services/detail_peserta.service.ts"
import { HttpError } from "../src/utils/http_error.ts"
import { authorizationHeader } from "./auth.ts"

const detailPeserta = {
    id: 1,
    peserta_id: 10,
    nama: "Andi Santoso",
    status_keluarga: "ANAK",
    isActive: true,
    createdAt: "2026-10-16T00:00:00.000Z",
    updatedAt: "2026-10-16T00:00:00.000Z",
} satisfies Awaited<ReturnType<typeof detailPesertaService.getById>>

const createPayload = {
    nama: "Andi Santoso",
    status_keluarga: "ANAK" as const,
    peserta_id: 10,
}

describe("Detail Peserta API", () => {
    beforeEach(() => {
        jest.spyOn(detailPesertaService, "listByPesertaId").mockResolvedValue([detailPeserta])
        jest.spyOn(detailPesertaService, "getById").mockResolvedValue(detailPeserta)
        jest.spyOn(detailPesertaService, "create").mockResolvedValue(detailPeserta)
        jest.spyOn(detailPesertaService, "update").mockResolvedValue(detailPeserta)
        jest.spyOn(detailPesertaService, "delete").mockResolvedValue(detailPeserta)
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe("GET /detail-peserta-by-peserta/:peserta_id", () => {
        it("mengambil daftar detail peserta berdasarkan peserta_id", async () => {
            const response = await request(app)
                .get("/api/detail-peserta-by-peserta/10")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(200)
            expect(response.body).toEqual({
                status: "success",
                message: "Success",
                data: [expect.objectContaining({ id: 1, peserta_id: 10, nama: "Andi Santoso" })],
            })
            expect(detailPesertaService.listByPesertaId).toHaveBeenCalledWith(10)
        })

        it("mengembalikan 400 untuk peserta_id yang tidak valid", async () => {
            const response = await request(app)
                .get("/api/detail-peserta-by-peserta/0")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(400)
            expect(response.body.message).toBe("Validation Error")
            expect(detailPesertaService.listByPesertaId).not.toHaveBeenCalled()
        })

        it("mengembalikan 404 jika data tidak ditemukan", async () => {
            jest.spyOn(detailPesertaService, "listByPesertaId").mockRejectedValue(
                new HttpError(404, "Detail peserta tidak ditemukan."),
            )

            const response = await request(app)
                .get("/api/detail-peserta-by-peserta/99")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(404)
            expect(response.body).toEqual({
                status: "failed",
                message: "Detail peserta tidak ditemukan.",
            })
        })

        it("mengembalikan 500 jika layanan gagal", async () => {
            jest.spyOn(console, "error").mockImplementation(() => {})
            jest.spyOn(detailPesertaService, "listByPesertaId").mockRejectedValue(
                new Error("unexpected failure"),
            )

            const response = await request(app)
                .get("/api/detail-peserta-by-peserta/10")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(500)
            // 5xx sekarang membawa `code` + `requestId` — jangan kunci ke shape persis.
            expect(response.body).toEqual(
                expect.objectContaining({
                    status: "failed",
                    message: "Terjadi kesalahan pada server.",
                }),
            )
        })
    })

    describe("GET /detail-peserta/:id", () => {
        it("mengambil detail peserta berdasarkan id", async () => {
            const response = await request(app)
                .get("/api/detail-peserta/1")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(200)
            expect(response.body.data).toEqual(
                expect.objectContaining({ id: 1, nama: "Andi Santoso" }),
            )
            expect(detailPesertaService.getById).toHaveBeenCalledWith(1)
        })

        it("mengembalikan 400 untuk id yang bukan bilangan bulat positif", async () => {
            const response = await request(app)
                .get("/api/detail-peserta/abc")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(400)
            expect(detailPesertaService.getById).not.toHaveBeenCalled()
        })

        it("mengembalikan 404 jika detail peserta tidak ditemukan", async () => {
            jest.spyOn(detailPesertaService, "getById").mockRejectedValue(
                new HttpError(404, "Detail peserta tidak ditemukan."),
            )

            const response = await request(app)
                .get("/api/detail-peserta/99")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(404)
            expect(response.body).toEqual({
                status: "failed",
                message: "Detail peserta tidak ditemukan.",
            })
        })
    })

    describe("POST /detail-peserta", () => {
        it("membuat detail peserta dengan input valid", async () => {
            const response = await request(app)
                .post("/api/detail-peserta")
                .set("Authorization", authorizationHeader())
                .send(createPayload)

            expect(response.status).toBe(201)
            expect(response.body).toEqual({
                status: "success",
                message: "Detail peserta berhasil dibuat",
                data: expect.objectContaining({ id: 1, peserta_id: 10 }),
            })
            expect(detailPesertaService.create).toHaveBeenCalledWith({
                ...createPayload,
                isActive: true,
            })
        })

        it("menolak body dengan status_keluarga tidak valid", async () => {
            const response = await request(app)
                .post("/api/detail-peserta")
                .set("Authorization", authorizationHeader())
                .send({ ...createPayload, status_keluarga: "Tetangga" })

            expect(response.status).toBe(400)
            expect(response.body.message).toBe("Validation Error")
            expect(detailPesertaService.create).not.toHaveBeenCalled()
        })

        it("menolak body dengan field tidak dikenal (strict object)", async () => {
            const response = await request(app)
                .post("/api/detail-peserta")
                .set("Authorization", authorizationHeader())
                .send({ ...createPayload, unknownField: true })

            expect(response.status).toBe(400)
            expect(detailPesertaService.create).not.toHaveBeenCalled()
        })

        it("mengembalikan 404 jika peserta tujuan tidak ditemukan", async () => {
            jest.spyOn(detailPesertaService, "create").mockRejectedValue(
                new HttpError(404, "Peserta tidak ditemukan / sudah tidak aktif."),
            )

            const response = await request(app)
                .post("/api/detail-peserta")
                .set("Authorization", authorizationHeader())
                .send(createPayload)

            expect(response.status).toBe(404)
            expect(response.body).toEqual({
                status: "failed",
                message: "Peserta tidak ditemukan / sudah tidak aktif.",
            })
        })
    })

    describe("PATCH /detail-peserta/:id", () => {
        it("memperbarui detail peserta berdasarkan id", async () => {
            const response = await request(app)
                .patch("/api/detail-peserta/1")
                .set("Authorization", authorizationHeader())
                .send({ nama: "Andi Baru" })

            expect(response.status).toBe(200)
            expect(response.body).toEqual({
                status: "success",
                message: "Detail peserta berhasil diperbarui",
                data: expect.objectContaining({ id: 1 }),
            })
            // isActive sengaja TIDAK di-default pada PATCH; hanya field yang
            // dikirim klien yang diteruskan ke service.
            expect(detailPesertaService.update).toHaveBeenCalledWith(1, { nama: "Andi Baru" })
        })

        it("mengembalikan 400 untuk id path yang tidak valid", async () => {
            const response = await request(app)
                .patch("/api/detail-peserta/0")
                .set("Authorization", authorizationHeader())
                .send({ nama: "Andi Baru" })

            expect(response.status).toBe(400)
            expect(response.body.message).toBe("Validation Error")
            expect(detailPesertaService.update).not.toHaveBeenCalled()
        })

        it("mengembalikan 400 untuk body yang tidak valid", async () => {
            const response = await request(app)
                .patch("/api/detail-peserta/1")
                .set("Authorization", authorizationHeader())
                .send({ nama: "x" })

            expect(response.status).toBe(400)
            expect(detailPesertaService.update).not.toHaveBeenCalled()
        })

        it("mengembalikan 404 jika detail peserta tidak ditemukan saat update", async () => {
            jest.spyOn(detailPesertaService, "update").mockRejectedValue(
                new HttpError(404, "Detail peserta tidak ditemukan."),
            )

            const response = await request(app)
                .patch("/api/detail-peserta/99")
                .set("Authorization", authorizationHeader())
                .send({ nama: "Andi Baru" })

            expect(response.status).toBe(404)
            expect(response.body).toEqual({
                status: "failed",
                message: "Detail peserta tidak ditemukan.",
            })
        })
    })

    describe("DELETE /detail-peserta/:id", () => {
        it("menghapus detail peserta berdasarkan id", async () => {
            const response = await request(app)
                .delete("/api/detail-peserta/1")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(200)
            expect(response.body).toEqual({
                status: "success",
                message: "Detail peserta berhasil dihapus",
                data: expect.objectContaining({ id: 1 }),
            })
            expect(detailPesertaService.delete).toHaveBeenCalledWith(1)
        })

        it("mengembalikan 400 untuk id yang tidak valid", async () => {
            const response = await request(app)
                .delete("/api/detail-peserta/abc")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(400)
            expect(detailPesertaService.delete).not.toHaveBeenCalled()
        })

        it("mengembalikan 404 jika detail peserta tidak ditemukan saat hapus", async () => {
            jest.spyOn(detailPesertaService, "delete").mockRejectedValue(
                new HttpError(404, "Detail peserta tidak ditemukan."),
            )

            const response = await request(app)
                .delete("/api/detail-peserta/99")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(404)
            expect(response.body).toEqual({
                status: "failed",
                message: "Detail peserta tidak ditemukan.",
            })
        })
    })
})
