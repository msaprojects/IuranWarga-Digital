import { beforeEach, describe, expect, it, jest, mock } from "bun:test"
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
                peserta: { where: mockWhere },
                detail_peserta: { where: mockWhere, create: mockCreate },
            },
        },
    },
}))

const { detailPesertaService } = await import("../src/services/detail_peserta.service.ts")

// Fixture harus berbentuk baris utuh: Bun menurunkan tipe parameter
// `toBe`/`toEqual` dari nilai aktual, sedangkan `db.orm` mengembalikan baris
// lengkap termasuk kolom yang diurus database (createdAt/updatedAt).
// `as const` menjaga `status_keluarga` tetap literal, bukan melebar ke `string`.
const existingDetailPeserta = {
    id: 1,
    peserta_id: 1,
    nama: "Budi",
    status_keluarga: "KEPALA_KELUARGA" as const,
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
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
            mockFirst.mockResolvedValue({ id: 1 })
            mockAll.mockResolvedValue([existingDetailPeserta])

            const result = await detailPesertaService.listByPesertaId(1, 7)

            expect(result).toEqual([existingDetailPeserta])
            expect(mockWhere).toHaveBeenCalledWith({ id: 1, organisasi_id: 7, isActive: true })
            expect(mockWhere).toHaveBeenCalledWith({ peserta_id: 1, isActive: true })
        })

        it("menolak peserta milik organisasi lain", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(detailPesertaService.listByPesertaId(1, 7)).rejects.toThrow(
                new HttpError(404, "Peserta tidak ditemukan / sudah tidak aktif."),
            )
            expect(mockAll).not.toHaveBeenCalled()
        })
    })

    describe("getById", () => {
        it("mengembalikan baris saat ditemukan", async () => {
            mockFirst.mockResolvedValue(existingDetailPeserta)

            await expect(detailPesertaService.getById(1, 7)).resolves.toBe(existingDetailPeserta)
            expect(mockWhere).toHaveBeenCalledWith({ id: 1, isActive: true })
            expect(mockWhere).toHaveBeenCalledWith({ id: 1, organisasi_id: 7, isActive: true })
        })

        it("melempar 404 saat tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(detailPesertaService.getById(99, 7)).rejects.toThrow(
                new HttpError(404, "Detail peserta tidak ditemukan."),
            )
        })

        it("melempar 404 saat peserta induk bukan milik tenant", async () => {
            mockFirst.mockResolvedValueOnce(existingDetailPeserta).mockResolvedValue(null)

            await expect(detailPesertaService.getById(1, 7)).rejects.toThrow(
                new HttpError(404, "Peserta tidak ditemukan / sudah tidak aktif."),
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
            await expect(detailPesertaService.create(input, 7)).resolves.toBe(existingDetailPeserta)

            expect(mockWhere).toHaveBeenCalledWith({ id: 1, organisasi_id: 7, isActive: true })
            expect(mockCreate).toHaveBeenCalledWith(input)
        })

        it("default-kan isActive menjadi true bila tidak dikirim", async () => {
            mockFirst.mockResolvedValue({ id: 1 })
            mockCreate.mockResolvedValue(existingDetailPeserta)

            await detailPesertaService.create(
                {
                    peserta_id: 1,
                    nama: "Budi",
                    status_keluarga: "KEPALA_KELUARGA",
                },
                7,
            )

            expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }))
        })

        it("melempar 404 saat peserta tidak ditemukan / tidak aktif", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(
                detailPesertaService.create(
                    {
                        peserta_id: 999,
                        nama: "Budi",
                        status_keluarga: "KEPALA_KELUARGA",
                        isActive: true,
                    },
                    7,
                ),
            ).rejects.toThrow(new HttpError(404, "Peserta tidak ditemukan / sudah tidak aktif."))

            expect(mockCreate).not.toHaveBeenCalled()
        })
    })

    describe("update", () => {
        it("menggabungkan input dengan data tersimpan", async () => {
            mockFirst.mockResolvedValue(existingDetailPeserta)
            mockUpdate.mockResolvedValue({ ...existingDetailPeserta, nama: "Siti" })

            await detailPesertaService.update(1, 7, { nama: "Siti" })

            // `.where()` #2 = verifikasi peserta induk terhadap tenant.
            expect(mockWhere).toHaveBeenNthCalledWith(2, {
                id: 1,
                organisasi_id: 7,
                isActive: true,
            })
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
            // `.first()` #1 → existing detail_peserta; #2 & #3 → peserta (induk
            // dan tujuan) harus lolos verifikasi tenant.
            mockFirst.mockResolvedValueOnce(existingDetailPeserta).mockResolvedValue({ id: 42 })
            mockUpdate.mockResolvedValue({ ...existingDetailPeserta, peserta_id: 42 })

            await detailPesertaService.update(1, 7, { peserta_id: 42 })

            // urutan `.where()`: (1) find existing {id:1}, (2) verifikasi peserta
            // induk, (3) cek peserta tujuan, (4) update target {id:1}.
            expect(mockWhere).toHaveBeenCalledWith({ id: 42, organisasi_id: 7, isActive: true })
            expect(mockWhere).toHaveBeenNthCalledWith(4, { id: 1 })
        })

        it("melempar 404 saat peserta tujuan tidak aktif", async () => {
            mockFirst
                .mockResolvedValueOnce(existingDetailPeserta)
                .mockResolvedValueOnce({ id: 1 })
                .mockResolvedValue(null)

            await expect(detailPesertaService.update(1, 7, { peserta_id: 999 })).rejects.toThrow(
                new HttpError(404, "Peserta tujuan tidak ditemukan / sudah tidak aktif."),
            )
            expect(mockUpdate).not.toHaveBeenCalled()
        })

        it("melempar 404 saat detail peserta tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(detailPesertaService.update(99, 7, { nama: "X" })).rejects.toThrow(
                new HttpError(404, "Detail peserta tidak ditemukan."),
            )
            expect(mockUpdate).not.toHaveBeenCalled()
        })

        it("melempar 404 saat peserta induk bukan milik tenant", async () => {
            mockFirst.mockResolvedValueOnce(existingDetailPeserta).mockResolvedValue(null)

            await expect(detailPesertaService.update(1, 7, { nama: "X" })).rejects.toThrow(
                new HttpError(404, "Peserta tidak ditemukan / sudah tidak aktif."),
            )
            expect(mockUpdate).not.toHaveBeenCalled()
        })
    })

    describe("delete", () => {
        it("menghapus saat data ditemukan", async () => {
            mockFirst.mockResolvedValue(existingDetailPeserta)
            // `.delete()` mengembalikan baris utuh, bukan `{ id }` saja.
            mockDelete.mockResolvedValue(existingDetailPeserta)

            const deleted = await detailPesertaService.delete(1, 7)

            expect(deleted).toBe(existingDetailPeserta)
            expect(mockWhere).toHaveBeenCalledWith({ id: 1, organisasi_id: 7, isActive: true })
            expect(mockDelete).toHaveBeenCalled()
        })

        it("melempar 404 saat data tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(detailPesertaService.delete(99, 7)).rejects.toThrow(
                new HttpError(404, "Detail peserta tidak ditemukan."),
            )
            expect(mockDelete).not.toHaveBeenCalled()
        })

        it("melempar 404 saat peserta induk bukan milik tenant", async () => {
            mockFirst.mockResolvedValueOnce(existingDetailPeserta).mockResolvedValue(null)

            await expect(detailPesertaService.delete(1, 7)).rejects.toThrow(
                new HttpError(404, "Peserta tidak ditemukan / sudah tidak aktif."),
            )
            expect(mockDelete).not.toHaveBeenCalled()
        })
    })
})
