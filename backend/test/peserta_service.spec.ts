import { beforeEach, describe, expect, it, jest } from "@jest/globals"
import { HttpError } from "../src/utils/http_error.ts"

// Rantai query `db.orm` dipalsukan. Nama variabel diawali `mock` agar boleh
// direferensikan dari factory `jest.unstable_mockModule`.
// Tip eksplisit `(...args: any[]) => Promise<any>` diperlukan agar:
//  - `mockResolvedValue` tidak menyempit ke `never` (return = Promise).
//  - `toHaveBeenCalledWith(value)` tidak gagal TS2554 "Expected 0 arguments".
const mockFirst = jest.fn<(...args: any[]) => Promise<any>>()
const mockAll = jest.fn<(...args: any[]) => Promise<any>>()
const mockUpdate = jest.fn<(...args: any[]) => Promise<any>>()
const mockCreate = jest.fn<(...args: any[]) => Promise<any>>()
const mockSelect = jest.fn<(...args: any[]) => any>(() => ({
    first: mockFirst,
    all: mockAll,
}))
const mockWhere = jest.fn<(...args: any[]) => any>(() => ({
    first: mockFirst,
    all: mockAll,
    update: mockUpdate,
    select: mockSelect,
}))

jest.unstable_mockModule("../src/prisma/db.ts", () => ({
    db: {
        orm: {
            public: {
                organisasi: { where: mockWhere },
                user: { where: mockWhere },
                peserta: { where: mockWhere, create: mockCreate },
            },
        },
    },
}))

const { pesertaService } = await import("../src/services/peserta.service.ts")

const existingPeserta = {
    id: 1,
    kode: "PST001",
    nama: "Budi",
    nomor_rumah: "A-01",
    alamat: "Jl. Melati",
    deskripsi: null,
    qr_token: "tok",
    qr_path: "x.png",
    isActive: true,
    organisasi_id: 1,
    user_id: 2,
    jenis_peserta: 'RUMAH',
}

beforeEach(() => {
    mockFirst.mockReset()
    mockAll.mockReset()
    mockUpdate.mockReset()
    mockCreate.mockReset()
    mockSelect.mockClear()
    mockWhere.mockClear()
})

describe("PesertaService", () => {
    describe("getAllPesertaByOrganizationCode", () => {
        it("memfilter isActive: true dan memanggil select() untuk list", async () => {
            // org lookup -> first(); list -> select().all()
            mockFirst.mockResolvedValue({ id: 1 })
            mockAll.mockResolvedValue([existingPeserta])

            const result = await pesertaService.getAllPesertaByOrganizationCode("ORG001")

            expect(result).toEqual([existingPeserta])
            expect(mockWhere).toHaveBeenCalledWith({ kode: "ORG001", isActive: true })
            expect(mockWhere).toHaveBeenCalledWith({ organisasi_id: 1, isActive: true })
        })

        it("melempar 404 saat organisasi tidak ditemukan / tidak aktif", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(pesertaService.getAllPesertaByOrganizationCode("ORGXXX")).rejects.toThrow(
                new HttpError(404, "Organisasi tidak ditemukan / sudah tidak aktif."),
            )
            expect(mockAll).not.toHaveBeenCalled()
        })
    })

    describe("getPesertaByIdAndOrganizationCode", () => {
        it("mengembalikan detail saat peserta ditemukan", async () => {
            mockFirst.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(existingPeserta)

            await expect(
                pesertaService.getPesertaByIdAndOrganizationCode(1, "ORG001"),
            ).resolves.toBe(existingPeserta)
        })

        it("melempar 404 saat peserta tidak ditemukan", async () => {
            mockFirst.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null)

            await expect(
                pesertaService.getPesertaByIdAndOrganizationCode(99, "ORG001"),
            ).rejects.toThrow(new HttpError(404, "Peserta tidak ditemukan / sudah tidak aktif."))
        })
    })

    describe("createPeserta", () => {
        it("menyimpan peserta dengan kode eksplisit + field default null", async () => {
            // Urutan first(): organisasi aktif → user_id valid → kode unik (null = tersedia).
            mockFirst
                .mockResolvedValueOnce({ id: 1 })
                .mockResolvedValueOnce({ id: 2 })
                .mockResolvedValueOnce(null)
            mockCreate.mockResolvedValue(existingPeserta)

            const result = await pesertaService.createPeserta({
                kode: "PST001",
                nama: "Budi",
                organisasi_id: 1,
                user_id: 2,
            })

            expect(result).toBe(existingPeserta)
            expect(mockCreate).toHaveBeenCalledWith({
                kode: "PST001",
                nama: "Budi",
                nomor_rumah: null,
                alamat: null,
                deskripsi: null,
                qr_token: null,
                isActive: true,
                organisasi_id: 1,
                user_id: 2,
                jenis_peserta:'RUMAH'
            })
        })

        it("melempar 404 saat organisasi tidak aktif", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(
                pesertaService.createPeserta({ nama: "Budi", organisasi_id: 999 }),
            ).rejects.toThrow(new HttpError(404, "Organisasi tidak ditemukan / sudah tidak aktif."))
            expect(mockCreate).not.toHaveBeenCalled()
        })

        it("melempar 404 saat user_id diberikan tapi user tidak ada", async () => {
            mockFirst.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null)

            await expect(
                pesertaService.createPeserta({ nama: "Budi", organisasi_id: 1, user_id: 99 }),
            ).rejects.toThrow(new HttpError(404, "User tidak ditemukan / sudah tidak aktif."))
            expect(mockCreate).not.toHaveBeenCalled()
        })

        it("melempar 409 saat qr_token sudah dipakai", async () => {
            mockFirst.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(existingPeserta)

            await expect(
                pesertaService.createPeserta({
                    nama: "Budi",
                    organisasi_id: 1,
                    qr_token: "duplikat",
                }),
            ).rejects.toThrow(new HttpError(409, "QR Code sudah digunakan."))
            expect(mockCreate).not.toHaveBeenCalled()
        })

        it("melempar 409 saat kode eksplisit sudah dipakai dalam organisasi", async () => {
            mockFirst.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(existingPeserta)

            await expect(
                pesertaService.createPeserta({
                    nama: "Budi",
                    organisasi_id: 1,
                    kode: "PST001",
                }),
            ).rejects.toThrow(
                new HttpError(409, "Kode peserta sudah digunakan, silakan gunakan kode lain."),
            )
            expect(mockCreate).not.toHaveBeenCalled()
        })
    })

    describe("updatePeserta", () => {
        it("melempar 404 saat peserta tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(pesertaService.updatePeserta(99, { nama: "X" })).rejects.toThrow(
                new HttpError(404, "Peserta tidak ditemukan."),
            )
            expect(mockUpdate).not.toHaveBeenCalled()
        })

        it("null eksplisit menggantikan nilai tersimpan; undefined dibiarkan", async () => {
            mockFirst.mockResolvedValue(existingPeserta)
            mockUpdate.mockResolvedValue({ ...existingPeserta, nomor_rumah: null })

            await pesertaService.updatePeserta(1, { nomor_rumah: null })

            // PATCH semantics: hanya `nomor_rumah` yang berubah; field lain
            // tetap memakai nilai existing karena tidak dikirim (undefined).
            expect(mockUpdate).toHaveBeenCalledWith({
                nama: existingPeserta.nama,
                nomor_rumah: null,
                alamat: existingPeserta.alamat,
                deskripsi: existingPeserta.deskripsi,
                qr_token: existingPeserta.qr_token,
                isActive: existingPeserta.isActive,
                user_id: existingPeserta.user_id,
                jenis_peserta: existingPeserta.jenis_peserta,
            })
        })

        it("memeriksa keunikan qr_token hanya bila nilainya berubah", async () => {
            // existing → clash check
            mockFirst.mockResolvedValueOnce(existingPeserta).mockResolvedValue(null)
            mockUpdate.mockResolvedValue(existingPeserta)

            await pesertaService.updatePeserta(1, { qr_token: "berbeda" })

            // Dipanggil 2x: (1) find peserta, (2) cek qr_token bebas.
            expect(mockFirst).toHaveBeenCalledTimes(2)
        })

        it("tidak memeriksa keunikan qr_token bila nilainya sama dengan existing", async () => {
            mockFirst.mockResolvedValue(existingPeserta)
            mockUpdate.mockResolvedValue(existingPeserta)

            await pesertaService.updatePeserta(1, { qr_token: existingPeserta.qr_token })

            // Dipanggil 1x saja (hanya find peserta).
            expect(mockFirst).toHaveBeenCalledTimes(1)
        })
    })

    describe("revokeQRCode", () => {
        it("melempar 404 saat peserta tidak cocok dengan organisasi", async () => {
            mockFirst.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null)

            await expect(pesertaService.revokeQRCode(99, "ORG001")).rejects.toThrow(
                new HttpError(404, "Peserta tidak ditemukan."),
            )
            expect(mockUpdate).not.toHaveBeenCalled()
        })

        it("men-null-kan qr_token & qr_path", async () => {
            mockFirst.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(existingPeserta)
            mockUpdate.mockResolvedValue({ ...existingPeserta, qr_token: null, qr_path: null })

            await pesertaService.revokeQRCode(1, "ORG001")

            expect(mockUpdate).toHaveBeenCalledWith({ qr_token: null, qr_path: null })
        })
    })
})
