import { afterEach, beforeEach, describe, expect, it, jest } from "bun:test"
import { request } from "./http.ts"
import app from "../src/app.ts"
import { tagihanIuranService } from "../src/services/tagihan_iuran.ts"
import { HttpError } from "../src/utils/http_error.ts"
import { authorizationHeader } from "./auth.ts"

const tagihan = {
    id: 1,
    nomor_tagihan: "TAG-202610-1AB12F",
    organisasi_id: 1,
    jenis_iuran_id: 1,
    peserta_id: 1,
    tahun: 2026,
    bulan: 10,
    tanggal_terbit: "2026-10-31",
    nominal_tagihan: "50000",
    nominal_terbayar: "0",
    status: "BELUM_BAYAR",
    createdAt: "2026-10-31T00:00:00.000Z",
    updatedAt: "2026-10-31T00:00:00.000Z",
}

const createPayload = {
    organisasi_id: 1,
    jenis_iuran_id: 1,
    tahun: 2026,
    bulan: 10,
    nominal_tagihan: "50000",
}

// Body PATCH tidak boleh menyertakan organisasi_id (skema update bersifat strict).
const updatePayload = {
    jenis_iuran_id: 1,
    tahun: 2026,
    bulan: 10,
    nominal_tagihan: "50000",
}

describe("Tagihan Iuran API", () => {
    beforeEach(() => {
        jest.spyOn(tagihanIuranService, "getAll").mockResolvedValue([tagihan] as never)
        jest.spyOn(tagihanIuranService, "create").mockResolvedValue([tagihan] as never)
        jest.spyOn(tagihanIuranService, "update").mockResolvedValue(tagihan as never)
        jest.spyOn(tagihanIuranService, "delete").mockResolvedValue(tagihan as never)
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it("menyediakan dokumentasi OpenAPI untuk endpoint tagihan iuran", async () => {
        const response = await request(app).get("/api-docs.json")

        expect(response.status).toBe(200)
        expect(response.body.paths["/tagihan-iuran"].post).toBeDefined()
        expect(response.body.paths["/tagihan-iuran/{id}"].patch).toBeDefined()
        expect(response.body.paths["/tagihan-iuran/{id}"].delete).toBeDefined()
        expect(response.body.paths["/tagihan-iuran/organisasi/{organisasi_id}"].get).toBeDefined()
        expect(
            response.body.paths["/tagihan-iuran"].post.requestBody.content["application/json"]
                .schema.$ref,
        ).toBe("#/components/schemas/CreateTagihanIuranInput")
        expect(response.body.components.schemas.CreateTagihanIuranInput.required).toEqual([
            "organisasi_id",
            "jenis_iuran_id",
            "tahun",
            "bulan",
            "nominal_tagihan",
        ])
    })

    describe("Proteksi autentikasi", () => {
        it("mengembalikan 401 tanpa token", async () => {
            const response = await request(app).get("/api/tagihan-iuran/organisasi/1")

            expect(response.status).toBe(401)
            expect(response.body.message).toBe("Token autentikasi tidak ditemukan.")
            expect(tagihanIuranService.getAll).not.toHaveBeenCalled()
        })
    })

    describe("GET /tagihan-iuran/organisasi/:organisasi_id", () => {
        it("mengembalikan daftar tagihan untuk id organisasi valid", async () => {
            const response = await request(app)
                .get("/api/tagihan-iuran/organisasi/1")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(200)
            expect(response.body).toEqual({
                status: "success",
                message: "Success",
                data: [expect.objectContaining({ id: 1, organisasi_id: 1 })],
            })
            expect(tagihanIuranService.getAll).toHaveBeenCalledWith(1)
        })

        it("mengembalikan 400 untuk id organisasi yang tidak valid", async () => {
            const response = await request(app)
                .get("/api/tagihan-iuran/organisasi/abc")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(400)
            expect(response.body.message).toBe("Validation Error")
            expect(tagihanIuranService.getAll).not.toHaveBeenCalled()
        })
    })

    describe("POST /tagihan-iuran", () => {
        it("menerbitkan tagihan dengan body valid", async () => {
            const response = await request(app)
                .post("/api/tagihan-iuran")
                .set("Authorization", authorizationHeader())
                .send(createPayload)

            expect(response.status).toBe(201)
            expect(response.body).toEqual({
                status: "success",
                message: "Success",
                data: [expect.objectContaining({ id: 1, status: "BELUM_BAYAR" })],
            })
            expect(tagihanIuranService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    organisasi_id: 1,
                    jenis_iuran_id: 1,
                    tahun: 2026,
                    bulan: 10,
                    nominal_tagihan: "50000",
                }),
            )
        })

        it("menolak bulan di luar rentang 1-12", async () => {
            const response = await request(app)
                .post("/api/tagihan-iuran")
                .set("Authorization", authorizationHeader())
                .send({ ...createPayload, bulan: 13 })

            expect(response.status).toBe(400)
            expect(response.body.message).toBe("Validation Error")
            expect(tagihanIuranService.create).not.toHaveBeenCalled()
        })

        it("menolak nominal_tagihan yang bukan string angka positif", async () => {
            const response = await request(app)
                .post("/api/tagihan-iuran")
                .set("Authorization", authorizationHeader())
                .send({ ...createPayload, nominal_tagihan: "abc" })

            expect(response.status).toBe(400)
            expect(response.body.message).toBe("Validation Error")
            expect(tagihanIuranService.create).not.toHaveBeenCalled()
        })

        it("menolak field tidak dikenal (strict object)", async () => {
            const response = await request(app)
                .post("/api/tagihan-iuran")
                .set("Authorization", authorizationHeader())
                .send({ ...createPayload, unknownField: true })

            expect(response.status).toBe(400)
            expect(tagihanIuranService.create).not.toHaveBeenCalled()
        })

        it("mengembalikan 404 jika tidak ada peserta aktif", async () => {
            jest.spyOn(tagihanIuranService, "create").mockRejectedValue(
                new HttpError(404, "Tidak ada peserta aktif dalam organisasi ini"),
            )

            const response = await request(app)
                .post("/api/tagihan-iuran")
                .set("Authorization", authorizationHeader())
                .send(createPayload)

            expect(response.status).toBe(404)
            expect(response.body).toEqual({
                status: "failed",
                message: "Tidak ada peserta aktif dalam organisasi ini",
            })
        })
    })

    describe("PATCH /tagihan-iuran/:id", () => {
        it("memperbarui tagihan berdasarkan id", async () => {
            const response = await request(app)
                .patch("/api/tagihan-iuran/1")
                .set("Authorization", authorizationHeader())
                .send({ ...updatePayload, bulan: 11, nominal_tagihan: "60000" })

            expect(response.status).toBe(200)
            expect(response.body.data).toEqual(expect.objectContaining({ id: 1 }))
            expect(tagihanIuranService.update).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ bulan: 11, nominal_tagihan: "60000" }),
            )
        })

        it("mengembalikan 400 untuk id path yang tidak valid", async () => {
            const response = await request(app)
                .patch("/api/tagihan-iuran/0")
                .set("Authorization", authorizationHeader())
                .send({ ...updatePayload, bulan: 11 })

            expect(response.status).toBe(400)
            expect(response.body.message).toBe("Validation Error")
            expect(tagihanIuranService.update).not.toHaveBeenCalled()
        })

        it("mengembalikan 404 jika tagihan tidak ditemukan saat update", async () => {
            jest.spyOn(tagihanIuranService, "update").mockRejectedValue(
                new HttpError(404, "Tagihan Iuran Tidak Ditemukan"),
            )

            const response = await request(app)
                .patch("/api/tagihan-iuran/99")
                .set("Authorization", authorizationHeader())
                .send({ ...updatePayload, bulan: 11 })

            expect(response.status).toBe(404)
            expect(response.body).toEqual({
                status: "failed",
                message: "Tagihan Iuran Tidak Ditemukan",
            })
        })
    })

    describe("DELETE /tagihan-iuran/:id", () => {
        it("menghapus tagihan berdasarkan id dengan pencatat dari token", async () => {
            const response = await request(app)
                .delete("/api/tagihan-iuran/1")
                .set("Authorization", authorizationHeader())
                .send({ deleted_reason: "Peserta pindah rumah" })

            expect(response.status).toBe(200)
            expect(response.body.data).toEqual(expect.objectContaining({ id: 1 }))
            // userId = 1 dari token uji (test/auth.ts).
            expect(tagihanIuranService.delete).toHaveBeenCalledWith(
                1,
                1,
                "Peserta pindah rumah",
            )
        })

        it("mengembalikan 400 untuk id yang tidak valid", async () => {
            const response = await request(app)
                .delete("/api/tagihan-iuran/abc")
                .set("Authorization", authorizationHeader())
                .send({ deleted_reason: "Peserta pindah rumah" })

            expect(response.status).toBe(400)
            expect(tagihanIuranService.delete).not.toHaveBeenCalled()
        })

        it("mengembalikan 400 saat alasan penghapusan tidak dikirim", async () => {
            const response = await request(app)
                .delete("/api/tagihan-iuran/1")
                .set("Authorization", authorizationHeader())

            expect(response.status).toBe(400)
            expect(response.body.message).toBe("Validation Error")
            expect(tagihanIuranService.delete).not.toHaveBeenCalled()
        })

        it("mengembalikan 404 jika tagihan tidak ditemukan saat hapus", async () => {
            jest.spyOn(tagihanIuranService, "delete").mockRejectedValue(
                new HttpError(404, "Tagihan Iuran Tidak Ditemukan"),
            )

            const response = await request(app)
                .delete("/api/tagihan-iuran/99")
                .set("Authorization", authorizationHeader())
                .send({ deleted_reason: "Peserta pindah rumah" })

            expect(response.status).toBe(404)
            expect(response.body).toEqual({
                status: "failed",
                message: "Tagihan Iuran Tidak Ditemukan",
            })
        })
    })
})
