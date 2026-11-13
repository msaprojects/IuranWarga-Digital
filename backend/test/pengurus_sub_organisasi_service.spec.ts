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
                user: { where: mockWhere },
                pengurus_sub_organisasi: { where: mockWhere, create: mockCreate },
            },
        },
    },
}))

const { pengurusSubOrganisasiService } =
    await import("../src/services/pengurus_sub_organisasi.service.ts")

const subOrganisasiInduk = { id: 1, organisasi_id: 7, nama: "PKK", isActive: true }
const userTenant = { id: 3, organisasi_id: 7, isActive: true }
const existingPengurus = {
    id: 9,
    sub_organisasi_id: 1,
    user_id: 3,
    jabatan: "KETUA",
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

describe("PengurusSubOrganisasiService", () => {
    describe("list", () => {
        it("memverifikasi induk lebih dulu lalu memfilter sub_organisasi_id", async () => {
            mockFirst.mockResolvedValue(subOrganisasiInduk)
            mockAll.mockResolvedValue([existingPengurus])

            const result = await pengurusSubOrganisasiService.list(1, 7)

            // Cast `unknown`: tipe hasil `db.orm` terlalu kompleks untuk overload
            // `toEqual` Bun (TS2769), padahal nilainya diteruskan apa adanya.
            expect(result as unknown).toEqual([existingPengurus])
            expect(mockWhere).toHaveBeenNthCalledWith(1, {
                id: 1,
                organisasi_id: 7,
                isActive: true,
            })
            expect(mockWhere).toHaveBeenNthCalledWith(2, { sub_organisasi_id: 1 })
        })

        it("melempar 404 saat sub organisasi induk bukan milik tenant", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(pengurusSubOrganisasiService.list(1, 7)).rejects.toThrow(NotFoundError)
            expect(mockAll).not.toHaveBeenCalled()
        })
    })

    describe("create", () => {
        it("menyimpan pengurus setelah induk, user, dan duplikat lolos", async () => {
            mockFirst
                .mockResolvedValueOnce(subOrganisasiInduk)
                .mockResolvedValueOnce(userTenant)
                .mockResolvedValueOnce(null)
            mockCreate.mockResolvedValue(existingPengurus)

            await pengurusSubOrganisasiService.create(1, 7, { user_id: 3, jabatan: "KETUA" })

            // User wajib terikat ke organisasi pemanggil dan masih aktif.
            expect(mockWhere).toHaveBeenNthCalledWith(2, {
                id: 3,
                organisasi_id: 7,
                isActive: true,
            })
            expect(mockWhere).toHaveBeenNthCalledWith(3, { sub_organisasi_id: 1, user_id: 3 })
            expect(mockCreate).toHaveBeenCalledWith({
                sub_organisasi_id: 1,
                user_id: 3,
                jabatan: "KETUA",
                isActive: true,
            })
        })

        it("menolak user dari organisasi lain atau tanpa organisasi", async () => {
            // `user.organisasi_id` nullable: user lintas organisasi juga gagal
            // filter ini, sehingga tidak bisa diangkat menjadi pengurus.
            mockFirst.mockResolvedValueOnce(subOrganisasiInduk).mockResolvedValueOnce(null)

            await expect(
                pengurusSubOrganisasiService.create(1, 7, { user_id: 3, jabatan: "KETUA" }),
            ).rejects.toThrow(
                new NotFoundError("User tidak ditemukan / tidak aktif di organisasi ini."),
            )
            expect(mockCreate).not.toHaveBeenCalled()
        })

        it("menolak user yang sudah menjadi pengurus sub organisasi ini", async () => {
            mockFirst
                .mockResolvedValueOnce(subOrganisasiInduk)
                .mockResolvedValueOnce(userTenant)
                .mockResolvedValueOnce(existingPengurus)

            await expect(
                pengurusSubOrganisasiService.create(1, 7, { user_id: 3, jabatan: "SEKRETARIS" }),
            ).rejects.toThrow(ConflictError)
            expect(mockCreate).not.toHaveBeenCalled()
        })
    })

    describe("update", () => {
        it("mengubah jabatan tanpa menyentuh pasangan identitas", async () => {
            mockFirst
                .mockResolvedValueOnce(existingPengurus)
                .mockResolvedValueOnce(subOrganisasiInduk)
            mockUpdate.mockResolvedValue({ ...existingPengurus, jabatan: "BENDAHARA" })

            await pengurusSubOrganisasiService.update(9, 7, { jabatan: "BENDAHARA" })

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    jabatan: "BENDAHARA",
                    isActive: true,
                    updatedAt: expect.any(String),
                }),
            )
            // `sub_organisasi_id` / `user_id` sengaja tidak ikut ditulis.
            const payload = mockUpdate.mock.calls[0]?.[0] as Record<string, unknown>
            expect(payload["sub_organisasi_id"]).toBeUndefined()
            expect(payload["user_id"]).toBeUndefined()
        })

        it("melempar 404 saat induk bukan milik tenant", async () => {
            mockFirst.mockResolvedValueOnce(existingPengurus).mockResolvedValue(null)

            await expect(
                pengurusSubOrganisasiService.update(9, 7, { jabatan: "BENDAHARA" }),
            ).rejects.toThrow(NotFoundError)
            expect(mockUpdate).not.toHaveBeenCalled()
        })

        it("melempar 404 saat baris pengurus tidak ada", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(
                pengurusSubOrganisasiService.update(99, 7, { jabatan: "BENDAHARA" }),
            ).rejects.toThrow(new NotFoundError("Pengurus sub organisasi tidak ditemukan."))
            expect(mockUpdate).not.toHaveBeenCalled()
        })
    })

    describe("delete", () => {
        it("menghapus baris pengurus (hard delete)", async () => {
            mockFirst
                .mockResolvedValueOnce(existingPengurus)
                .mockResolvedValueOnce(subOrganisasiInduk)
            mockDelete.mockResolvedValue({ id: 9 })

            const deleted = await pengurusSubOrganisasiService.delete(9, 7)

            expect(deleted as unknown).toEqual({ id: 9 })
            expect(mockDelete).toHaveBeenCalled()
        })

        it("melempar 404 saat induk bukan milik tenant", async () => {
            mockFirst.mockResolvedValueOnce(existingPengurus).mockResolvedValue(null)

            await expect(pengurusSubOrganisasiService.delete(9, 7)).rejects.toThrow(NotFoundError)
            expect(mockDelete).not.toHaveBeenCalled()
        })
    })
})
