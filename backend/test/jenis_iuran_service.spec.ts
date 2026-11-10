import { beforeEach, afterEach, describe, expect, it, jest, mock } from "bun:test"
import { HttpError } from "../src/utils/http_error.ts"

// Rantai query `db.orm` dipalsukan. Nama variabel diawali `mock` agar boleh
// direferensikan dari factory `mock.module`.
// Tip eksplisit `(...args: any[]) => Promise<any>` diperlukan agar:
//  - `mockResolvedValue` tidak menyempit ke `never` (return = Promise).
//  - `toHaveBeenCalledWith(value)` tidak gagal TS2554 "Expected 0 arguments"
//    (Parameters<T> = any[], bukan []).
const mockFirst = jest.fn<(...args: any[]) => Promise<any>>()
const mockAll = jest.fn<(...args: any[]) => Promise<any>>()
const mockUpdate = jest.fn<(...args: any[]) => Promise<any>>()
const mockDelete = jest.fn<(...args: any[]) => Promise<any>>()
const mockCreate = jest.fn<(...args: any[]) => Promise<any>>()
const mockWhere = jest.fn<(...args: any[]) => any>(() => ({
    first: mockFirst,
    all: mockAll,
    update: mockUpdate,
    delete: mockDelete,
}))

mock.module("../src/prisma/db.ts", () => ({
    db: {
        orm: {
            public: {
                organisasi: { where: mockWhere },
                jenis_iuran: { where: mockWhere, create: mockCreate },
            },
        },
    },
}))

const { jenisIuranService } = await import("../src/services/jenis_iuran.service.ts")

const existingJenisIuran = {
    id: 1,
    judul: "Iuran Kebersihan",
    periode_iuran: "BULANAN",
    jenis_peserta: "RUMAH",
    nominal: "50000",
    isActive: true,
    organisasi_id: 1,
}

beforeEach(() => {
    mockFirst.mockReset()
    mockAll.mockReset()
    mockUpdate.mockReset()
    mockDelete.mockReset()
    mockCreate.mockReset()
    mockWhere.mockClear()
})

afterEach(() => {
    jest.restoreAllMocks()
})

describe("JenisIuranService", () => {
    describe("createJenisIuran", () => {

        it("meneruskan nominal sebagai string ke db setelah organisasi tervalidasi", async () => {
            mockFirst.mockResolvedValue({ id: 1 })
            mockCreate.mockResolvedValue(existingJenisIuran)

            const input = {
                judul: "Iuran Keamanan",
                periode_iuran: "BULANAN" as const,
                jenis_peserta: "RUMAH" as const,
                nominal: "75000",
                organisasi_id: 1,
                isActive: true,
            }
            await expect(jenisIuranService.createJenisIuran(input)).resolves.toBeDefined()

            expect(mockWhere).toHaveBeenCalledWith({ id: 1, isActive: true })
            expect(mockCreate).toHaveBeenCalledWith(input)
        })

        it("melempar 404 saat organisasi tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(
                jenisIuranService.createJenisIuran({
                    judul: "Iuran Keamanan",
                    periode_iuran: "BULANAN",
                    jenis_peserta: "RUMAH",
                    nominal: "75000",
                    organisasi_id: 999,
                    isActive: true,
                }),
            ).rejects.toThrow(new HttpError(404, "Organisasi tidak ditemukan / sudah tidak aktif."))

            expect(mockCreate).not.toHaveBeenCalled()
        })
    })

    describe("getJenisIuranByID", () => {
        it("membatasi lookup ke organisasi tenant", async () => {
            mockFirst.mockResolvedValue(existingJenisIuran)

            await jenisIuranService.getJenisIuranByID(1, 1)

            expect(mockWhere).toHaveBeenCalledWith({ id: 1, organisasi_id: 1 })
        })

        it("melempar 404 saat tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(jenisIuranService.getJenisIuranByID(99, 1)).rejects.toThrow(
                new HttpError(404, "Jenis iuran tidak ditemukan."),
            )
        })

        it("melempar 404 saat jenis iuran milik organisasi lain", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(jenisIuranService.getJenisIuranByID(1, 7)).rejects.toThrow(
                new HttpError(404, "Jenis iuran tidak ditemukan."),
            )
            expect(mockWhere).toHaveBeenCalledWith({ id: 1, organisasi_id: 7 })
        })

        it("mengembalikan baris saat ditemukan", async () => {
            mockFirst.mockResolvedValue(existingJenisIuran)

            await expect(jenisIuranService.getJenisIuranByID(1, 1)).resolves.toBe(
                existingJenisIuran,
            )
        })
    })

    describe("getJenisIuranByKodeOrganisasi", () => {
        it("memfilter jenis iuran yang aktif saja", async () => {
            mockFirst.mockResolvedValue({ id: 1 })
            mockAll.mockResolvedValue([existingJenisIuran])

            const result = await jenisIuranService.getJenisIuranByKodeOrganisasi("ORG001")

            expect(result).toEqual([existingJenisIuran])
            expect(mockWhere).toHaveBeenCalledWith({ organisasi_id: 1, isActive: true })
        })

        it("melempar 404 saat organisasi tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(jenisIuranService.getJenisIuranByKodeOrganisasi("ORG999")).rejects.toThrow(
                new HttpError(404, "Organisasi tidak ditemukan / sudah tidak aktif."),
            )

            expect(mockAll).not.toHaveBeenCalled()
        })
    })

    describe("updateJenisIuran", () => {
        it("menggabungkan input dengan data tersimpan", async () => {
            mockFirst.mockResolvedValue(existingJenisIuran)
            mockUpdate.mockResolvedValue({ ...existingJenisIuran, judul: "Iuran Sampah" })

            await jenisIuranService.updateJenisIuran(1, 1, { judul: "Iuran Sampah" })

            expect(mockWhere).toHaveBeenNthCalledWith(1, { id: 1, organisasi_id: 1 })
            expect(mockWhere).toHaveBeenNthCalledWith(2, { id: 1, organisasi_id: 1 })
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    judul: "Iuran Sampah",
                    jenis_peserta: "RUMAH",
                    nominal: "50000",
                    isActive: true,
                }),
            )
        })

        it("melempar 404 saat jenis iuran tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(
                jenisIuranService.updateJenisIuran(99, 1, { judul: "X" }),
            ).rejects.toThrow(new HttpError(404, "Jenis iuran tidak ditemukan."))
            expect(mockUpdate).not.toHaveBeenCalled()
        })

        it("melempar 404 saat jenis iuran milik organisasi lain", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(
                jenisIuranService.updateJenisIuran(1, 7, { judul: "X" }),
            ).rejects.toThrow(new HttpError(404, "Jenis iuran tidak ditemukan."))
            expect(mockWhere).toHaveBeenCalledWith({ id: 1, organisasi_id: 7 })
            expect(mockUpdate).not.toHaveBeenCalled()
        })
    })

    describe("deleteJenisIuran", () => {
        it("menghapus saat data ditemukan", async () => {
            mockFirst.mockResolvedValue(existingJenisIuran)
            mockDelete.mockResolvedValue({ id: 1 })

            await expect(jenisIuranService.deleteJenisIuran(1, 1)).resolves.toEqual({ id: 1 })
            expect(mockWhere).toHaveBeenCalledWith({ id: 1, organisasi_id: 1 })
            expect(mockDelete).toHaveBeenCalled()
        })

        it("melempar 404 saat data tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(jenisIuranService.deleteJenisIuran(99, 1)).rejects.toThrow(
                new HttpError(404, "Jenis iuran tidak ditemukan."),
            )
            expect(mockDelete).not.toHaveBeenCalled()
        })

        it("melempar 404 saat jenis iuran milik organisasi lain", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(jenisIuranService.deleteJenisIuran(1, 7)).rejects.toThrow(
                new HttpError(404, "Jenis iuran tidak ditemukan."),
            )
            expect(mockWhere).toHaveBeenCalledWith({ id: 1, organisasi_id: 7 })
            expect(mockDelete).not.toHaveBeenCalled()
        })
    })
})
