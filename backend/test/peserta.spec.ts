import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals"
import request from "supertest"
import app from "../src/app.ts"
import { pesertaService } from "../src/services/peserta.service"
import { HttpError } from "../src/utils/http_error.ts"

const peserta = {
    id: 1,
    kode: "PST001",
    nama: "Budi Santoso",
    nomor_rumah: "A-01",
    alamat: "Jl. Melati No. 10",
    deskripsi: null,
    qr_token: "qr-token",
    qr_path: "",
    isActive: true,
    organisasi_id: 1,
    user_id: 2,
    createdAt: "2026-10-16T00:00:00.000Z",
    updatedAt: "2026-10-16T00:00:00.000Z",
} satisfies Awaited<ReturnType<typeof pesertaService.createPeserta>>

const createPayload = {
    nama: "Budi Santoso",
    nomor_rumah: "A-01",
    alamat: "Jl. Melati No. 10",
    organisasi_id: 1,
    user_id: 2,
}

describe("Peserta API", () => {
    beforeEach(() => {
        jest.spyOn(pesertaService, "getAllPesertaByOrganizationCode").mockResolvedValue([peserta])
        jest.spyOn(pesertaService, "getPesertaByIdAndOrganizationCode").mockResolvedValue(peserta)
        jest.spyOn(pesertaService, "createPeserta").mockResolvedValue(peserta)
        jest.spyOn(pesertaService, "updatePeserta").mockResolvedValue(peserta)
        jest.spyOn(pesertaService, "generateQrCode").mockResolvedValue("/uploads/qrcodes/ORG001-PST001.png")
        jest.spyOn(pesertaService, "decryptQrCode").mockResolvedValue(peserta)
        jest.spyOn(pesertaService, "revokeQRCode").mockResolvedValue(peserta)
        jest.spyOn(pesertaService, "downloadQrCode").mockResolvedValue(Buffer.from("fake-png"))
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it("mengambil daftar peserta berdasarkan kode organisasi", async () => {
        const response = await request(app).get("/api/peserta/ORG001")

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            status: "success",
            message: "Success",
            data: [expect.objectContaining({ id: 1, kode: "PST001", nama: "Budi Santoso" })],
        })
        expect(pesertaService.getAllPesertaByOrganizationCode).toHaveBeenCalledWith("ORG001")
    })

    it("mengembalikan 400 untuk kode organisasi yang tidak valid", async () => {
        const response = await request(app).get("/api/peserta/buruk")

        expect(response.status).toBe(400)
        expect(response.body.message).toBe("Validation Error")
        expect(pesertaService.getAllPesertaByOrganizationCode).not.toHaveBeenCalled()
    })

    it("mengembalikan 500 jika layanan daftar peserta gagal", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {})
        jest.spyOn(pesertaService, "getAllPesertaByOrganizationCode").mockRejectedValue(
            new Error("Organisasi tidak ditemukan"),
        )

        const response = await request(app).get("/api/peserta/ORG001")

        expect(response.status).toBe(500)
        expect(response.body).toEqual({ status: "failed", message: "Internal Server Error" })
    })

    it("mengambil detail peserta menggunakan ID dan kode organisasi", async () => {
        const response = await request(app).get("/api/peserta/1/ORG001")

        expect(response.status).toBe(200)
        expect(response.body.data).toEqual(expect.objectContaining({ id: 1, kode: "PST001" }))
        expect(pesertaService.getPesertaByIdAndOrganizationCode).toHaveBeenCalledWith(1, "ORG001")
    })

    it("mengembalikan 404 jika peserta tidak ditemukan", async () => {
        jest.spyOn(pesertaService, "getPesertaByIdAndOrganizationCode").mockResolvedValue(null)

        const response = await request(app).get("/api/peserta/99/ORG001")

        expect(response.status).toBe(404)
        expect(response.body).toEqual({
            status: "failed",
            message: "Peserta tidak ditemukan atau organisasi tidak aktif",
        })
    })

    it("mengembalikan 400 jika ID detail bukan bilangan bulat positif", async () => {
        const response = await request(app).get("/api/peserta/0/ORG001")

        expect(response.status).toBe(400)
        expect(pesertaService.getPesertaByIdAndOrganizationCode).not.toHaveBeenCalled()
    })

    it("membuat peserta dengan input valid", async () => {
        const response = await request(app).post("/api/peserta").send(createPayload)

        expect(response.status).toBe(201)
        expect(response.body).toEqual({
            status: "success",
            message: "Peserta berhasil dibuat",
            data: expect.objectContaining({ id: 1, kode: "PST001" }),
        })
        expect(pesertaService.createPeserta).toHaveBeenCalledWith({
            ...createPayload,
            isActive: true,
        })
    })

    it("menerima kode peserta opsional saat pembuatan", async () => {
        const response = await request(app)
            .post("/api/peserta")
            .send({ ...createPayload, kode: "PST002" })

        expect(response.status).toBe(201)
        expect(pesertaService.createPeserta).toHaveBeenCalledWith({
            ...createPayload,
            kode: "PST002",
            isActive: true,
        })
    })

    it("mengembalikan 409 jika kode peserta sudah digunakan", async () => {
        jest.spyOn(pesertaService, "createPeserta").mockRejectedValueOnce(
            new HttpError(409, "Kode peserta sudah digunakan, silakan gunakan kode lain."),
        )

        const response = await request(app)
            .post("/api/peserta")
            .send({ ...createPayload, kode: "PST001" })

        expect(response.status).toBe(409)
        expect(response.body.message).toBe("Kode peserta sudah digunakan, silakan gunakan kode lain.")
    })

    it("menolak pembuatan peserta dengan body tidak valid", async () => {
        const response = await request(app)
            .post("/api/peserta")
            .send({
                ...createPayload,
                nama: "x",
                unknownField: true,
            })

        expect(response.status).toBe(400)
        expect(response.body.message).toBe("Validation Error")
        expect(pesertaService.createPeserta).not.toHaveBeenCalled()
    })

    it("memperbarui peserta berdasarkan ID", async () => {
        const response = await request(app)
            .patch("/api/peserta/1")
            .send({ nama: "Budi Santoso Baru", user_id: 2 })

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            status: "success",
            message: "Peserta berhasil diperbarui",
            data: expect.objectContaining({ id: 1 }),
        })
        expect(pesertaService.updatePeserta).toHaveBeenCalledWith(1, {
            nama: "Budi Santoso Baru",
            user_id: 2,
            isActive: true,
        })
    })

    it("menolak pembaruan peserta jika nama atau user_id tidak disertakan", async () => {
        const response = await request(app).patch("/api/peserta/1").send({ alamat: "Alamat baru" })

        expect(response.status).toBe(400)
        expect(pesertaService.updatePeserta).not.toHaveBeenCalled()
    })

    it("membuat QR Code untuk peserta berdasarkan kode peserta dan kode organisasi", async () => {
        const response = await request(app).get("/api/peserta/qr/generate/PST001/ORG001")

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            status: "success",
            message: "QR Code berhasil digenerate",
            data: "/uploads/qrcodes/ORG001-PST001.png",
        })
        expect(pesertaService.generateQrCode).toHaveBeenCalledWith("PST001", "ORG001")
    })

    it("menolak permintaan generate QR Code dengan parameter tidak valid", async () => {
        const response = await request(app).get("/api/peserta/qr/generate/ab/ORG001")

        expect(response.status).toBe(400)
        expect(response.body.message).toBe("Validation Error")
        expect(pesertaService.generateQrCode).not.toHaveBeenCalled()
    })

    it("mengembalikan 404 jika peserta untuk QR Code tidak ditemukan", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {})
        jest.spyOn(pesertaService, "generateQrCode").mockRejectedValue(
            new HttpError(404, "Data Peserta tidak ditemukan."),
        )

        const response = await request(app).get("/api/peserta/qr/generate/PST001/ORG001")

        expect(response.status).toBe(404)
        expect(response.body).toEqual({ status: "failed", message: "Data Peserta tidak ditemukan." })
    })

    it("mencabut QR Code peserta berdasarkan ID dan kode organisasi", async () => {
        const response = await request(app).get("/api/peserta/qr/revoke/1/ORG001")

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            status: "success",
            message: "QR Code berhasil dicabut",
            data: expect.objectContaining({ id: 1 }),
        })
        expect(pesertaService.revokeQRCode).toHaveBeenCalledWith(1, "ORG001")
    })

    it("mendekripsi QR Code dan mengembalikan data peserta", async () => {
        const response = await request(app).get("/api/peserta/qr/decrypt/encrypted-qr-token")

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            status: "success",
            message: "QR Code berhasil didecrypt",
            data: expect.objectContaining({ id: 1, kode: "PST001" }),
        })
        expect(pesertaService.decryptQrCode).toHaveBeenCalledWith("encrypted-qr-token")
    })

    it("menolak string QR Code yang terlalu pendek", async () => {
        const response = await request(app).get("/api/peserta/qr/decrypt/ab")

        expect(response.status).toBe(400)
        expect(pesertaService.decryptQrCode).not.toHaveBeenCalled()
    })

    it("mendownload file QR Code berdasarkan qrUrl", async () => {
        const qrUrl = "/uploads/qrcodes/ORG001-PST001.png"
        const response = await request(app).get(
            `/api/peserta/qr/download/${encodeURIComponent(qrUrl)}`,
        )

        expect(response.status).toBe(200)
        expect(response.body.message).toBe("QR Code berhasil didownload")
        expect(pesertaService.downloadQrCode).toHaveBeenCalledWith(qrUrl)
    })

    it("menolak download QR Code dengan qrUrl tidak valid", async () => {
        const response = await request(app).get("/api/peserta/qr/download/ab")

        expect(response.status).toBe(400)
        expect(response.body.message).toBe("Validation Error")
        expect(pesertaService.downloadQrCode).not.toHaveBeenCalled()
    })

    it("mengembalikan 404 jika QR Code tidak ditemukan saat download", async () => {
        jest.spyOn(pesertaService, "downloadQrCode").mockRejectedValue(
            new HttpError(404, "QR Code tidak ditemukan atau kadaluarsa, harap generate kembali."),
        )

        const response = await request(app).get(
            `/api/peserta/qr/download/${encodeURIComponent("/uploads/qrcodes/tidak-ada.png")}`,
        )

        expect(response.status).toBe(404)
        expect(response.body).toEqual({
            status: "failed",
            message: "QR Code tidak ditemukan atau kadaluarsa, harap generate kembali.",
        })
    })
})
