import { beforeEach, afterEach, describe, expect, it, jest } from "@jest/globals"
import { HttpError } from "../src/utils/http_error.ts"

// Rantai query `db.orm` dipalsukan. Nama variabel diawali `mock` agar boleh
// direferensikan dari factory `jest.unstable_mockModule`.
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

jest.unstable_mockModule("../src/prisma/db.ts", () => ({
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

const now = new Date("2026-01-01T00:00:00.000Z")
const end = new Date("2026-12-31T00:00:00.000Z")

const existingJenisIuran = {
    id: 1,
    judul: "Iuran Kebersihan",
    periode_iuran: "BULANAN",
    jenis_peserta: "RUMAH",
    nominal: "50000",
    // Kolom `date-temporal` dikembalikan ORM sebagai Temporal.PlainDate, bukan Date.
    tanggal_awal: new Temporal.PlainDate(2026, 1, 1),
    tanggal_akhir: new Temporal.PlainDate(2026, 12, 31),
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
        it("melempar 400 saat tanggal_akhir mendahului tanggal_awal, tanpa menyentuh db", async () => {
            await expect(
                jenisIuranService.createJenisIuran({
                    judul: "Iuran Keamanan",
                    periode_iuran: "BULANAN",
                    jenis_peserta: "RUMAH",
                    nominal: "50000",
                    tanggal_awal: end,
                    tanggal_akhir: now,
                    organisasi_id: 1,
                    isActive: true,
                }),
            ).rejects.toThrow(HttpError)

            expect(mockCreate).not.toHaveBeenCalled()
        })

        it("meneruskan nominal sebagai string ke db setelah organisasi tervalidasi", async () => {
            mockFirst.mockResolvedValue({ id: 1 })
            mockCreate.mockResolvedValue(existingJenisIuran)

            const input = {
                judul: "Iuran Keamanan",
                periode_iuran: "BULANAN" as const,
                jenis_peserta: "RUMAH" as const,
                nominal: "75000",
                tanggal_awal: now,
                tanggal_akhir: end,
                organisasi_id: 1,
                isActive: true,
            }
            await expect(jenisIuranService.createJenisIuran(input)).resolves.toBeDefined()

            expect(mockWhere).toHaveBeenCalledWith({ id: 1, isActive: true })
            // Service menyesuaikan `Date` (lapisan transport) -> `Temporal.PlainDate` (codec date-temporal).
            expect(mockCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    judul: "Iuran Keamanan",
                    periode_iuran: "BULANAN",
                    jenis_peserta: "RUMAH",
                    nominal: "75000",
                    organisasi_id: 1,
                    tanggal_awal: expect.any(Temporal.PlainDate),
                    tanggal_akhir: expect.any(Temporal.PlainDate),
                }),
            )
        })

        it("melempar 404 saat organisasi tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(
                jenisIuranService.createJenisIuran({
                    judul: "Iuran Keamanan",
                    periode_iuran: "BULANAN",
                    jenis_peserta: "RUMAH",
                    nominal: "75000",
                    tanggal_awal: now,
                    tanggal_akhir: end,
                    organisasi_id: 999,
                    isActive: true,
                }),
            ).rejects.toThrow(new HttpError(404, "Organisasi tidak ditemukan / sudah tidak aktif."))

            expect(mockCreate).not.toHaveBeenCalled()
        })
    })

    describe("getJenisIuranByID", () => {
        it("melempar 404 saat tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(jenisIuranService.getJenisIuranByID(99)).rejects.toThrow(
                new HttpError(404, "Jenis iuran tidak ditemukan."),
            )
        })

        it("mengembalikan baris saat ditemukan", async () => {
            mockFirst.mockResolvedValue(existingJenisIuran)

            await expect(jenisIuranService.getJenisIuranByID(1)).resolves.toBe(existingJenisIuran)
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

            await jenisIuranService.updateJenisIuran(1, { judul: "Iuran Sampah" })

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    judul: "Iuran Sampah",
                    nominal: "50000",
                    tanggal_awal: expect.any(Temporal.PlainDate),
                    tanggal_akhir: expect.any(Temporal.PlainDate),
                    isActive: true,
                }),
            )
        })

        it("melempar 404 saat jenis iuran tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(jenisIuranService.updateJenisIuran(99, { judul: "X" })).rejects.toThrow(
                new HttpError(404, "Jenis iuran tidak ditemukan."),
            )
            expect(mockUpdate).not.toHaveBeenCalled()
        })
    })

    describe("deleteJenisIuran", () => {
        it("menghapus saat data ditemukan", async () => {
            mockFirst.mockResolvedValue(existingJenisIuran)
            mockDelete.mockResolvedValue({ id: 1 })

            await expect(jenisIuranService.deleteJenisIuran(1)).resolves.toEqual({ id: 1 })
            expect(mockDelete).toHaveBeenCalled()
        })

        it("melempar 404 saat data tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(jenisIuranService.deleteJenisIuran(99)).rejects.toThrow(
                new HttpError(404, "Jenis iuran tidak ditemukan."),
            )
            expect(mockDelete).not.toHaveBeenCalled()
        })
    })
})
