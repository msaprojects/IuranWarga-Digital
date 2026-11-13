import { beforeEach, describe, expect, it, jest, mock } from "bun:test"
import { ConflictError, NotFoundError } from "../src/utils/http_error.ts"

// Rantai query `db.orm` dipalsukan. Nama variabel diawali `mock` agar boleh
// direferensikan dari factory `mock.module`.
const mockFirst = jest.fn<(...args: any[]) => Promise<any>>()
const mockAll = jest.fn<(...args: any[]) => Promise<any>>()
const mockCreate = jest.fn<(...args: any[]) => Promise<any>>()
const mockUpdate = jest.fn<(...args: any[]) => Promise<any>>()
const mockWhere = jest.fn<(...args: any[]) => any>(() => ({
    first: mockFirst,
    all: mockAll,
    update: mockUpdate,
}))

mock.module("../src/prisma/db.ts", () => ({
    db: {
        orm: {
            public: {
                sub_organisasi: { where: mockWhere, create: mockCreate },
            },
        },
    },
}))

const { subOrganisasiService } = await import("../src/services/sub_organisasi.service.ts")

const existingSubOrganisasi = {
    id: 1,
    organisasi_id: 7,
    nama: "PKK",
    deskripsi: "Pemberdayaan Kesejahteraan Keluarga",
    pisah_laporan: true,
    isActive: true,
}

beforeEach(() => {
    mockFirst.mockReset()
    mockAll.mockReset()
    mockCreate.mockReset()
    mockUpdate.mockReset()
    mockWhere.mockClear()
})

describe("SubOrganisasiService", () => {
    describe("assertSubOrganisasiDalamTenant", () => {
        it("memfilter id + organisasi_id + isActive saat verifikasi induk", async () => {
            mockFirst.mockResolvedValue(existingSubOrganisasi)

            const subOrganisasi = await subOrganisasiService.assertSubOrganisasiDalamTenant(1, 7)

            // Cast `unknown`: tipe hasil `db.orm` terlalu kompleks untuk overload
            // `toBe`/`toEqual` Bun (TS2769), padahal nilainya diteruskan apa adanya.
            expect(subOrganisasi as unknown).toBe(existingSubOrganisasi)

            expect(mockWhere).toHaveBeenCalledWith({ id: 1, organisasi_id: 7, isActive: true })
        })

        it("melempar 404 saat sub organisasi bukan milik tenant", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(
                subOrganisasiService.assertSubOrganisasiDalamTenant(1, 7),
            ).rejects.toThrow(
                new NotFoundError("Sub organisasi tidak ditemukan / sudah tidak aktif."),
            )
        })
    })

    describe("getAll", () => {
        it("memfilter tenant tanpa menyembunyikan baris nonaktif", async () => {
            mockAll.mockResolvedValue([
                existingSubOrganisasi,
                { ...existingSubOrganisasi, id: 2, isActive: false },
            ])

            const result = await subOrganisasiService.getAll(7)

            expect(result).toHaveLength(2)
            // Tanpa `isActive`, agar baris nonaktif tetap bisa ditemukan dan
            // diaktifkan kembali lewat PATCH.
            expect(mockWhere).toHaveBeenCalledWith({ organisasi_id: 7 })
        })
    })

    describe("getById", () => {
        it("mengembalikan baris milik tenant walau nonaktif", async () => {
            const nonaktif = { ...existingSubOrganisasi, isActive: false }
            mockFirst.mockResolvedValue(nonaktif)

            const subOrganisasi = await subOrganisasiService.getById(1, 7)

            expect(subOrganisasi as unknown).toBe(nonaktif)
            expect(mockWhere).toHaveBeenCalledWith({ id: 1, organisasi_id: 7 })
        })

        it("melempar 404 saat tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(subOrganisasiService.getById(99, 7)).rejects.toThrow(
                new NotFoundError("Sub organisasi tidak ditemukan."),
            )
        })
    })

    describe("create", () => {
        it("memaksa organisasi_id dari tenant dan mengisi default", async () => {
            mockFirst.mockResolvedValue(null)
            mockCreate.mockResolvedValue(existingSubOrganisasi)

            await subOrganisasiService.create({ nama: "PKK" }, 7)

            expect(mockWhere).toHaveBeenCalledWith({ organisasi_id: 7, nama: "PKK" })
            expect(mockCreate).toHaveBeenCalledWith({
                organisasi_id: 7,
                nama: "PKK",
                deskripsi: null,
                pisah_laporan: false,
                isActive: true,
            })
        })

        it("menolak nama yang sudah dipakai walau sub organisasi nonaktif", async () => {
            // Dicek tanpa filter isActive karena nama nonaktif tetap terpakai
            // oleh constraint unik [organisasi_id, nama].
            mockFirst.mockResolvedValue({ ...existingSubOrganisasi, isActive: false })

            await expect(
                subOrganisasiService.create({ nama: "PKK" }, 7),
            ).rejects.toThrow(ConflictError)
            expect(mockWhere).toHaveBeenCalledWith({ organisasi_id: 7, nama: "PKK" })
            expect(mockCreate).not.toHaveBeenCalled()
        })
    })

    describe("update", () => {
        it("memvalidasi nama baru lalu menulis perubahan + updatedAt", async () => {
            mockFirst
                .mockResolvedValueOnce(existingSubOrganisasi) // assertEksis
                .mockResolvedValueOnce(null) // assertNamaBebas
            mockUpdate.mockResolvedValue({ ...existingSubOrganisasi, nama: "PKK RW 05" })

            await subOrganisasiService.update(1, 7, { nama: "PKK RW 05" })

            expect(mockWhere).toHaveBeenNthCalledWith(2, { organisasi_id: 7, nama: "PKK RW 05" })
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    nama: "PKK RW 05",
                    deskripsi: existingSubOrganisasi.deskripsi,
                    pisah_laporan: true,
                    isActive: true,
                    updatedAt: expect.any(String),
                }),
            )
        })

        it("tidak memeriksa keunikan saat nama tidak berubah", async () => {
            mockFirst.mockResolvedValue(existingSubOrganisasi)
            mockUpdate.mockResolvedValue(existingSubOrganisasi)

            await subOrganisasiService.update(1, 7, { nama: "PKK" })

            // Hanya dua `.where()`: verifikasi tenant + update target.
            expect(mockWhere).toHaveBeenCalledTimes(2)
            expect(mockWhere).toHaveBeenNthCalledWith(2, { id: 1, organisasi_id: 7 })
        })

        it("mengizinkan deskripsi dikosongkan (null)", async () => {
            mockFirst.mockResolvedValue(existingSubOrganisasi)
            mockUpdate.mockResolvedValue({ ...existingSubOrganisasi, deskripsi: null })

            await subOrganisasiService.update(1, 7, { deskripsi: null })

            // `??` akan mempertahankan nilai lama; harus tetap null.
            expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ deskripsi: null }))
        })

        it("melempar 404 saat sub organisasi bukan milik tenant", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(subOrganisasiService.update(1, 7, { nama: "X" })).rejects.toThrow(
                new NotFoundError("Sub organisasi tidak ditemukan."),
            )
            expect(mockUpdate).not.toHaveBeenCalled()
        })
    })

    describe("deactivate", () => {
        it("melakukan soft delete, bukan hard delete", async () => {
            mockFirst.mockResolvedValue(existingSubOrganisasi)
            mockUpdate.mockResolvedValue({ ...existingSubOrganisasi, isActive: false })

            await subOrganisasiService.deactivate(1, 7)

            expect(mockWhere).toHaveBeenCalledWith({ id: 1, organisasi_id: 7 })
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ isActive: false, updatedAt: expect.any(String) }),
            )
        })

        it("melempar 404 saat sub organisasi tidak ditemukan", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(subOrganisasiService.deactivate(99, 7)).rejects.toThrow(NotFoundError)
            expect(mockUpdate).not.toHaveBeenCalled()
        })
    })
})
