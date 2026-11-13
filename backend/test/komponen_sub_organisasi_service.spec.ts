import { beforeEach, describe, expect, it, jest, mock } from "bun:test"
import { ConflictError, NotFoundError } from "../src/utils/http_error.ts"

const mockFirst = jest.fn<(...args: any[]) => Promise<any>>()
const mockAll = jest.fn<(...args: any[]) => Promise<any>>()
const mockCreate = jest.fn<(...args: any[]) => Promise<any>>()
const mockUpdate = jest.fn<(...args: any[]) => Promise<any>>()
const mockDelete = jest.fn<(...args: any[]) => Promise<any>>()
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
                sub_organisasi: { where: mockWhere },
                jenis_iuran: { where: mockWhere },
                komponen_sub_organisasi: { where: mockWhere, create: mockCreate },
            },
        },
    },
}))

const { komponenSubOrganisasiService } =
    await import("../src/services/komponen_sub_organisasi.service.ts")

const subOrganisasiInduk = { id: 1, organisasi_id: 7, nama: "PKK", isActive: true }
const jenisIuranTenant = { id: 2, organisasi_id: 7, isActive: true }
const existingKomponen = {
    id: 4,
    sub_organisasi_id: 1,
    jenis_iuran_id: 2,
    nominal: "75000",
    isActive: true,
}

beforeEach(() => {
    mockFirst.mockReset()
    mockAll.mockReset()
    mockCreate.mockReset()
    mockUpdate.mockReset()
    mockDelete.mockReset()
    mockWhere.mockClear()
})

describe("KomponenSubOrganisasiService", () => {
    describe("list", () => {
        it("memverifikasi induk lebih dulu lalu memfilter sub_organisasi_id", async () => {
            mockFirst.mockResolvedValue(subOrganisasiInduk)
            mockAll.mockResolvedValue([existingKomponen])

            const result = await komponenSubOrganisasiService.list(1, 7)

            // Cast `unknown`: tipe hasil `db.orm` terlalu kompleks untuk overload
            // `toEqual` Bun (TS2769), padahal nilainya diteruskan apa adanya.
            expect(result as unknown).toEqual([existingKomponen])
            expect(mockWhere).toHaveBeenNthCalledWith(1, {
                id: 1,
                organisasi_id: 7,
                isActive: true,
            })
            expect(mockWhere).toHaveBeenNthCalledWith(2, { sub_organisasi_id: 1 })
        })

        it("melempar 404 saat sub organisasi induk bukan milik tenant", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(komponenSubOrganisasiService.list(1, 7)).rejects.toThrow(NotFoundError)
            expect(mockAll).not.toHaveBeenCalled()
        })
    })

    describe("create", () => {
        it("menyimpan override setelah induk, jenis iuran, dan duplikat lolos", async () => {
            mockFirst
                .mockResolvedValueOnce(subOrganisasiInduk)
                .mockResolvedValueOnce(jenisIuranTenant)
                .mockResolvedValueOnce(null)
            mockCreate.mockResolvedValue(existingKomponen)

            await komponenSubOrganisasiService.create(1, 7, {
                jenis_iuran_id: 2,
                nominal: "75000",
            })

            // Jenis iuran milik tenant lain tetap valid secara global, jadi
            // scope organisasi_id + isActive wajib ikut di filter.
            expect(mockWhere).toHaveBeenNthCalledWith(2, {
                id: 2,
                organisasi_id: 7,
                isActive: true,
            })
            expect(mockWhere).toHaveBeenNthCalledWith(3, {
                sub_organisasi_id: 1,
                jenis_iuran_id: 2,
            })
            expect(mockCreate).toHaveBeenCalledWith({
                sub_organisasi_id: 1,
                jenis_iuran_id: 2,
                nominal: "75000",
                isActive: true,
            })
        })

        it("menolak jenis iuran organisasi lain atau yang sudah nonaktif", async () => {
            mockFirst.mockResolvedValueOnce(subOrganisasiInduk).mockResolvedValueOnce(null)

            await expect(
                komponenSubOrganisasiService.create(1, 7, {
                    jenis_iuran_id: 2,
                    nominal: "75000",
                }),
            ).rejects.toThrow(new NotFoundError("Jenis Iuran Tidak Ditemukan"))
            expect(mockCreate).not.toHaveBeenCalled()
        })

        it("menolak konfigurasi ganda untuk jenis iuran yang sama", async () => {
            mockFirst
                .mockResolvedValueOnce(subOrganisasiInduk)
                .mockResolvedValueOnce(jenisIuranTenant)
                .mockResolvedValueOnce(existingKomponen)

            await expect(
                komponenSubOrganisasiService.create(1, 7, {
                    jenis_iuran_id: 2,
                    nominal: "80000",
                }),
            ).rejects.toThrow(ConflictError)
            expect(mockCreate).not.toHaveBeenCalled()
        })
    })

    describe("update", () => {
        it("mengubah nominal tanpa menyentuh pasangan identitas", async () => {
            mockFirst
                .mockResolvedValueOnce(existingKomponen)
                .mockResolvedValueOnce(subOrganisasiInduk)
            mockUpdate.mockResolvedValue({ ...existingKomponen, nominal: "80000" })

            await komponenSubOrganisasiService.update(4, 7, { nominal: "80000" })

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    nominal: "80000",
                    isActive: true,
                    updatedAt: expect.any(String),
                }),
            )
            const payload = mockUpdate.mock.calls[0]?.[0] as Record<string, unknown>
            expect(payload["sub_organisasi_id"]).toBeUndefined()
            expect(payload["jenis_iuran_id"]).toBeUndefined()
        })

        it("mengizinkan override dihentikan lewat isActive: false", async () => {
            mockFirst
                .mockResolvedValueOnce(existingKomponen)
                .mockResolvedValueOnce(subOrganisasiInduk)
            mockUpdate.mockResolvedValue({ ...existingKomponen, isActive: false })

            await komponenSubOrganisasiService.update(4, 7, { isActive: false })

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ isActive: false, nominal: "75000" }),
            )
        })

        it("melempar 404 saat induk bukan milik tenant", async () => {
            mockFirst.mockResolvedValueOnce(existingKomponen).mockResolvedValue(null)

            await expect(
                komponenSubOrganisasiService.update(4, 7, { nominal: "80000" }),
            ).rejects.toThrow(NotFoundError)
            expect(mockUpdate).not.toHaveBeenCalled()
        })

        it("melempar 404 saat baris komponen tidak ada", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(
                komponenSubOrganisasiService.update(99, 7, { nominal: "80000" }),
            ).rejects.toThrow(new NotFoundError("Komponen sub organisasi tidak ditemukan."))
            expect(mockUpdate).not.toHaveBeenCalled()
        })
    })

    describe("delete", () => {
        it("menghapus baris komponen (hard delete)", async () => {
            mockFirst
                .mockResolvedValueOnce(existingKomponen)
                .mockResolvedValueOnce(subOrganisasiInduk)
            mockDelete.mockResolvedValue({ id: 4 })

            const deleted = await komponenSubOrganisasiService.delete(4, 7)

            expect(deleted as unknown).toEqual({ id: 4 })
            expect(mockDelete).toHaveBeenCalled()
        })

        it("melempar 404 saat induk bukan milik tenant", async () => {
            mockFirst.mockResolvedValueOnce(existingKomponen).mockResolvedValue(null)

            await expect(komponenSubOrganisasiService.delete(4, 7)).rejects.toThrow(NotFoundError)
            expect(mockDelete).not.toHaveBeenCalled()
        })
    })
})
