import { beforeEach, describe, expect, it, jest, mock } from "bun:test"
import { ConflictError, NotFoundError } from "../src/utils/http_error.ts"

// Rantai query `db.orm` dipalsukan. Nama variabel diawali `mock` agar boleh
// direferensikan dari factory `mock.module`.
// Tip eksplisit `(...args: any[]) => Promise<any>` diperlukan agar:
//  - `mockResolvedValue` tidak menyempit ke `never` (return = Promise).
//  - `toHaveBeenCalledWith(value)` tidak gagal TS2554 "Expected 0 arguments"
//    (Parameters<T> = any[], bukan []).
const mockFirst = jest.fn<(...args: any[]) => Promise<any>>()
const mockAll = jest.fn<(...args: any[]) => Promise<any>>()
const mockCreateAll = jest.fn<(...args: any[]) => Promise<any>>()
const mockWhere = jest.fn<(...args: any[]) => any>(() => ({
    first: mockFirst,
    all: mockAll,
}))

mock.module("../src/prisma/db.ts", () => ({
    db: {
        orm: {
            public: {
                organisasi: { where: mockWhere },
                jenis_iuran: { where: mockWhere },
                peserta: { where: mockWhere },
                tagihan_iuran: { where: mockWhere, createAll: mockCreateAll },
            },
        },
    },
}))

const { tagihanIuranService } = await import("../src/services/tagihan_iuran.ts")

const input = {
    organisasi_id: 1,
    jenis_iuran_id: 2,
    tahun: 2026,
    bulan: 10,
    nominal_tagihan: "50000",
}

const pesertaAktif = [{ id: 1 }, { id: 2 }, { id: 3 }]

const tagihanLama = (peserta_id: number) => ({
    id: peserta_id,
    nomor_tagihan: `TAG-202610-${peserta_id}AB12`,
    organisasi_id: input.organisasi_id,
    jenis_iuran_id: input.jenis_iuran_id,
    peserta_id,
    tahun: input.tahun,
    bulan: input.bulan,
    nominal_tagihan: input.nominal_tagihan,
    nominal_terbayar: "0",
    status: "BELUM_BAYAR",
    deletedAt: null,
})

// Filter yang diharapkan untuk query tagihan yang sudah ada pada satu periode.
const wherePeriode = {
    organisasi_id: input.organisasi_id,
    jenis_iuran_id: input.jenis_iuran_id,
    tahun: input.tahun,
    bulan: input.bulan,
}

beforeEach(() => {
    mockFirst.mockReset()
    mockAll.mockReset()
    mockCreateAll.mockReset()
    mockWhere.mockClear()
})

describe("TagihanIuranService", () => {
    describe("create", () => {
        // Organisasi + jenis iuran selalu ditemukan pada test di bawah.
        // Urutan pemanggilan `.all()`: (1) peserta aktif, (2) tagihan periode tersebut.
        const setupLookups = (tagihanPeriode: unknown[]) => {
            mockFirst.mockResolvedValue({ id: 1 })
            mockAll.mockResolvedValueOnce(pesertaAktif).mockResolvedValueOnce(tagihanPeriode)
        }

        it("hanya menerbitkan tagihan untuk peserta yang belum punya tagihan di periode yang sama", async () => {
            // Baris hasil insert cukup direpresentasikan oleh `id` untuk test ini.
            const barisTerbuat: any[] = [{ id: 10 }]
            setupLookups([tagihanLama(1), tagihanLama(2)])
            mockCreateAll.mockResolvedValue(barisTerbuat)

            const result = await tagihanIuranService.create(input)

            expect(mockCreateAll).toHaveBeenCalledTimes(1)
            const rows = mockCreateAll.mock.calls[0]?.[0] as Array<{ peserta_id: number }>
            expect(rows).toHaveLength(1)
            expect(rows.map((row) => row.peserta_id)).toEqual([3])
            expect(result).toEqual(barisTerbuat)
        })

        it("menerbitkan tagihan untuk seluruh peserta aktif saat periode belum punya tagihan", async () => {
            setupLookups([])
            mockCreateAll.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }])

            await tagihanIuranService.create(input)

            const rows = mockCreateAll.mock.calls[0]?.[0] as Array<Record<string, unknown>>
            expect(rows).toHaveLength(3)
            expect(rows.map((row) => row.peserta_id)).toEqual([1, 2, 3])
            expect(rows[0]).toEqual(
                expect.objectContaining({
                    organisasi_id: input.organisasi_id,
                    jenis_iuran_id: input.jenis_iuran_id,
                    tahun: input.tahun,
                    bulan: input.bulan,
                    nominal_tagihan: input.nominal_tagihan,
                    nominal_terbayar: "0",
                    status: "BELUM_BAYAR",
                }),
            )
            // nomor_tagihan = TAG-<tahun><bulan>-<peserta_id><4 karakter acak>.
            expect(rows[0]?.nomor_tagihan).toMatch(/^TAG-202610-1[A-Z0-9]{4}$/)
        })

        it("melempar 409 dan tidak menulis apa pun saat semua peserta sudah tertagih", async () => {
            setupLookups(pesertaAktif.map((peserta) => tagihanLama(peserta.id)))

            await expect(tagihanIuranService.create(input)).rejects.toThrow(
                new ConflictError("Semua peserta aktif sudah memiliki tagihan pada periode ini."),
            )
            expect(mockCreateAll).not.toHaveBeenCalled()
        })

        it("tetap menghitung tagihan yang sudah soft-delete sebagai tagihan yang ada", async () => {
            // Unique constraint (peserta_id, jenis_iuran_id, tahun, bulan) berlaku
            // untuk semua baris, termasuk yang deletedAt-nya terisi.
            setupLookups(
                pesertaAktif.map((peserta) => ({
                    ...tagihanLama(peserta.id),
                    deletedAt: "2026-10-05T00:00:00.000Z",
                })),
            )

            await expect(tagihanIuranService.create(input)).rejects.toThrow(ConflictError)
            expect(mockCreateAll).not.toHaveBeenCalled()
        })

        it("memfilter peserta aktif dan tagihan periode tanpa kolom isActive", async () => {
            setupLookups([tagihanLama(1)])
            mockCreateAll.mockResolvedValue([{ id: 10 }])

            await tagihanIuranService.create(input)

            // urutan `.where()`: (3) peserta aktif, (4) tagihan pada periode tersebut.
            expect(mockWhere).toHaveBeenNthCalledWith(3, {
                organisasi_id: input.organisasi_id,
                isActive: true,
            })
            expect(mockWhere).toHaveBeenNthCalledWith(4, wherePeriode)
        })

        it("melempar 404 tanpa menyentuh tabel tagihan saat tidak ada peserta aktif", async () => {
            mockFirst.mockResolvedValue({ id: 1 })
            mockAll.mockResolvedValueOnce([])

            await expect(tagihanIuranService.create(input)).rejects.toThrow(
                new NotFoundError("Tidak ada peserta aktif dalam organisasi ini"),
            )
            expect(mockAll).toHaveBeenCalledTimes(1)
            expect(mockCreateAll).not.toHaveBeenCalled()
        })
    })
})
