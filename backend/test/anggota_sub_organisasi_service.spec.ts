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
                peserta: { where: mockWhere },
                anggota_sub_organisasi: { where: mockWhere, create: mockCreate },
            },
        },
    },
}))

const { anggotaSubOrganisasiService } =
    await import("../src/services/anggota_sub_organisasi.service.ts")

const subOrganisasiInduk = { id: 1, organisasi_id: 7, nama: "PKK", isActive: true }
const pesertaTenant = { id: 10, organisasi_id: 7, isActive: true }
const existingAnggota = {
    id: 5,
    sub_organisasi_id: 1,
    peserta_id: 10,
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

describe("AnggotaSubOrganisasiService", () => {
    describe("list", () => {
        it("memverifikasi induk lebih dulu lalu memfilter sub_organisasi_id", async () => {
            mockFirst.mockResolvedValue(subOrganisasiInduk)
            mockAll.mockResolvedValue([existingAnggota])

            const result = await anggotaSubOrganisasiService.list(1, 7)

            // Cast `unknown`: tipe hasil `db.orm` terlalu kompleks untuk overload
            // `toEqual` Bun (TS2769), padahal nilainya diteruskan apa adanya.
            expect(result as unknown).toEqual([existingAnggota])
            expect(mockWhere).toHaveBeenNthCalledWith(1, {
                id: 1,
                organisasi_id: 7,
                isActive: true,
            })
            expect(mockWhere).toHaveBeenNthCalledWith(2, { sub_organisasi_id: 1 })
        })

        it("melempar 404 saat sub organisasi induk bukan milik tenant", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(anggotaSubOrganisasiService.list(1, 7)).rejects.toThrow(
                new NotFoundError("Sub organisasi tidak ditemukan / sudah tidak aktif."),
            )
            expect(mockAll).not.toHaveBeenCalled()
        })
    })

    describe("create", () => {
        it("menyimpan keanggotaan setelah induk, peserta, dan duplikat lolos", async () => {
            mockFirst
                .mockResolvedValueOnce(subOrganisasiInduk)
                .mockResolvedValueOnce(pesertaTenant)
                .mockResolvedValueOnce(null)
            mockCreate.mockResolvedValue(existingAnggota)

            await anggotaSubOrganisasiService.create(1, 7, { peserta_id: 10 })

            // Peserta wajib dari organisasi yang sama dan masih aktif.
            expect(mockWhere).toHaveBeenNthCalledWith(2, {
                id: 10,
                organisasi_id: 7,
                isActive: true,
            })
            expect(mockWhere).toHaveBeenNthCalledWith(3, {
                sub_organisasi_id: 1,
                peserta_id: 10,
            })
            expect(mockCreate).toHaveBeenCalledWith({
                sub_organisasi_id: 1,
                peserta_id: 10,
                isActive: true,
            })
        })

        it("menolak peserta milik organisasi lain", async () => {
            mockFirst.mockResolvedValueOnce(subOrganisasiInduk).mockResolvedValueOnce(null)

            await expect(
                anggotaSubOrganisasiService.create(1, 7, { peserta_id: 10 }),
            ).rejects.toThrow(new NotFoundError("Peserta tidak ditemukan / sudah tidak aktif."))
            expect(mockCreate).not.toHaveBeenCalled()
        })

        it("menolak pendaftaran ganda pada sub organisasi yang sama", async () => {
            mockFirst
                .mockResolvedValueOnce(subOrganisasiInduk)
                .mockResolvedValueOnce(pesertaTenant)
                .mockResolvedValueOnce(existingAnggota)

            await expect(
                anggotaSubOrganisasiService.create(1, 7, { peserta_id: 10 }),
            ).rejects.toThrow(ConflictError)
            expect(mockCreate).not.toHaveBeenCalled()
        })
    })

    describe("update", () => {
        it("mengubah isActive setelah induk terverifikasi", async () => {
            mockFirst
                .mockResolvedValueOnce(existingAnggota)
                .mockResolvedValueOnce(subOrganisasiInduk)
            mockUpdate.mockResolvedValue({ ...existingAnggota, isActive: false })

            await anggotaSubOrganisasiService.update(5, 7, { isActive: false })

            expect(mockWhere).toHaveBeenNthCalledWith(1, { id: 5 })
            expect(mockWhere).toHaveBeenNthCalledWith(2, {
                id: 1,
                organisasi_id: 7,
                isActive: true,
            })
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ isActive: false, updatedAt: expect.any(String) }),
            )
        })

        it("melempar 404 saat induk bukan milik tenant", async () => {
            mockFirst.mockResolvedValueOnce(existingAnggota).mockResolvedValue(null)

            await expect(
                anggotaSubOrganisasiService.update(5, 7, { isActive: false }),
            ).rejects.toThrow(NotFoundError)
            expect(mockUpdate).not.toHaveBeenCalled()
        })

        it("melempar 404 saat baris keanggotaan tidak ada", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(
                anggotaSubOrganisasiService.update(99, 7, { isActive: false }),
            ).rejects.toThrow(new NotFoundError("Anggota sub organisasi tidak ditemukan."))
            expect(mockUpdate).not.toHaveBeenCalled()
        })
    })

    describe("delete", () => {
        it("menghapus baris keanggotaan (hard delete)", async () => {
            mockFirst
                .mockResolvedValueOnce(existingAnggota)
                .mockResolvedValueOnce(subOrganisasiInduk)
            mockDelete.mockResolvedValue({ id: 5 })

            const deleted = await anggotaSubOrganisasiService.delete(5, 7)

            expect(deleted as unknown).toEqual({ id: 5 })
            expect(mockWhere).toHaveBeenNthCalledWith(3, { id: 5 })
            expect(mockDelete).toHaveBeenCalled()
        })

        it("melempar 404 saat induk bukan milik tenant", async () => {
            mockFirst.mockResolvedValueOnce(existingAnggota).mockResolvedValue(null)

            await expect(anggotaSubOrganisasiService.delete(5, 7)).rejects.toThrow(NotFoundError)
            expect(mockDelete).not.toHaveBeenCalled()
        })
    })
})
