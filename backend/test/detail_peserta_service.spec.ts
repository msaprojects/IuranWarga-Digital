import { beforeEach, describe, expect, it, jest } from "@jest/globals"
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
                peserta: { where: mockWhere },
                detail_peserta: { where: mockWhere, create: mockCreate },
            },
        },
    },
}))

const { detailPesertaService } = await import("../src/services/detail_peserta.service.ts")

const existingDetailPeserta = {
    id: 1,
    peserta_id: 1,
    nama: "Budi",
    status_keluarga: "KEPALA_KELUARGA",
    isActive: true,
}

beforeEach(() => {
    mockFirst.mockReset()
    mockAll.mockReset()
    mockUpdate.mockReset()
    mockDelete.mockReset()
    mockCreate.mockReset()
    mockWhere.mockClear()
})

describe("DetailPesertaService", () => {
    describe("listByPesertaId", () => {
        it("memfilter isActive: true saat query list", async () => {
            mockAll.mockResolvedValue([existingDetailPeserta])

            const result = await detailPesertaService.listByPesertaId(1)

            expect(result).toEqual([existingDetailPeserta])
            expect(mockWhere).toHaveBeenCalledWith({ peserta_id: 1, isActive: true })
        })
    })

    describe("getById", () => {
        it("mengembalikan baris saat ditemukan", async () => {
            mockFirst.mockResolvedValue(existingDetailPeserta)

            await expect(detailPesertaService.getById(1)).resolves.toBe(existingDetailPeserta)
            expect(mockWhere).toHaveBeenCalledWith({ id: 1, isActive: true })
        })

        it("melempar 404 saat tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(detailPesertaService.getById(99)).rejects.toThrow(
                new HttpError(404, "Detail peserta tidak ditemukan."),
            )
        })
    })

    describe("create", () => {
        it("meneruskan create ke db setelah peserta tervalidasi", async () => {
            mockFirst.mockResolvedValue({ id: 1 })
            mockCreate.mockResolvedValue(existingDetailPeserta)

            const input = {
                peserta_id: 1,
                nama: "Budi",
                status_keluarga: "KEPALA_KELUARGA" as const,
                isActive: true,
            }
            await expect(detailPesertaService.create(input)).resolves.toBe(existingDetailPeserta)

            expect(mockWhere).toHaveBeenCalledWith({ id: 1, isActive: true })
            expect(mockCreate).toHaveBeenCalledWith(input)
        })

        it("default-kan isActive menjadi true bila tidak dikirim", async () => {
            mockFirst.mockResolvedValue({ id: 1 })
            mockCreate.mockResolvedValue(existingDetailPeserta)

            await detailPesertaService.create({
                peserta_id: 1,
                nama: "Budi",
                status_keluarga: "KEPALA_KELUARGA",
            })

            expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }))
        })

        it("melempar 404 saat peserta tidak ditemukan / tidak aktif", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(
                detailPesertaService.create({
                    peserta_id: 999,
                    nama: "Budi",
                    status_keluarga: "KEPALA_KELUARGA",
                    isActive: true,
                }),
            ).rejects.toThrow(new HttpError(404, "Peserta tidak ditemukan / sudah tidak aktif."))

            expect(mockCreate).not.toHaveBeenCalled()
        })
    })

    describe("update", () => {
        it("menggabungkan input dengan data tersimpan", async () => {
            mockFirst.mockResolvedValue(existingDetailPeserta)
            mockUpdate.mockResolvedValue({ ...existingDetailPeserta, nama: "Siti" })

            await detailPesertaService.update(1, { nama: "Siti" })

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    nama: "Siti",
                    status_keluarga: "KEPALA_KELUARGA",
                    peserta_id: 1,
                    isActive: true,
                }),
            )
        })

        it("memvalidasi peserta tujuan saat memindah anggota keluarga", async () => {
            // Panggilan `.first()` #1 → existing detail_peserta; #2 → peserta tujuan.
            mockFirst.mockResolvedValueOnce(existingDetailPeserta).mockResolvedValueOnce({ id: 42 })
            mockUpdate.mockResolvedValue({ ...existingDetailPeserta, peserta_id: 42 })

            await detailPesertaService.update(1, { peserta_id: 42 })

            // urutan `.where()`: (1) find existing {id:1}, (2) cek peserta tujuan
            // {id:42,isActive:true}, (3) update target {id:1}.
            expect(mockWhere).toHaveBeenCalledWith({ id: 42, isActive: true })
            expect(mockWhere).toHaveBeenNthCalledWith(3, { id: 1 })
        })

        it("melempar 404 saat peserta tujuan tidak aktif", async () => {
            mockFirst.mockResolvedValueOnce(existingDetailPeserta).mockResolvedValueOnce(null)

            await expect(detailPesertaService.update(1, { peserta_id: 999 })).rejects.toThrow(
                new HttpError(404, "Peserta tujuan tidak ditemukan / sudah tidak aktif."),
            )
            expect(mockUpdate).not.toHaveBeenCalled()
        })

        it("melempar 404 saat detail peserta tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(detailPesertaService.update(99, { nama: "X" })).rejects.toThrow(
                new HttpError(404, "Detail peserta tidak ditemukan."),
            )
            expect(mockUpdate).not.toHaveBeenCalled()
        })
    })

    describe("delete", () => {
        it("menghapus saat data ditemukan", async () => {
            mockFirst.mockResolvedValue(existingDetailPeserta)
            mockDelete.mockResolvedValue({ id: 1 })

            await expect(detailPesertaService.delete(1)).resolves.toEqual({ id: 1 })
            expect(mockDelete).toHaveBeenCalled()
        })

        it("melempar 404 saat data tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(detailPesertaService.delete(99)).rejects.toThrow(
                new HttpError(404, "Detail peserta tidak ditemukan."),
            )
            expect(mockDelete).not.toHaveBeenCalled()
        })
    })
})
