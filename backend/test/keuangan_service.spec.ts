import { beforeEach, describe, expect, it, jest, mock } from "bun:test"
import { Temporal } from "temporal-polyfill"
import { NotFoundError } from "../src/utils/http_error.ts"

// Rantai query `db.orm` dipalsukan. Nama variabel diawali `mock` agar boleh
// direferensikan dari factory `mock.module`.
const mockFirst = jest.fn<(...args: any[]) => Promise<any>>()
const mockAll = jest.fn<(...args: any[]) => Promise<any>>()
const mockBuatKeuangan = jest.fn<(...args: any[]) => Promise<any>>()
const mockBuatDetail = jest.fn<(...args: any[]) => Promise<any>>()
const mockBuatLedger = jest.fn<(...args: any[]) => Promise<any>>()

const mockRantai: Record<string, unknown> = { first: mockFirst, all: mockAll }
const mockOrderBy = jest.fn<(...args: any[]) => any>(() => mockRantai)
const mockWhere = jest.fn<(...args: any[]) => any>(() => mockRantai)
mockRantai.where = mockWhere
mockRantai.orderBy = mockOrderBy

const mockModels = {
    keuangan: { where: mockWhere, create: mockBuatKeuangan },
    keuangan_detail: { where: mockWhere, createAll: mockBuatDetail },
    transaction_ledger: { where: mockWhere, createAll: mockBuatLedger },
}

const mockTransaction = jest.fn<(...args: any[]) => Promise<any>>((fn: any) =>
    fn({ orm: { public: mockModels } }),
)

mock.module("../src/prisma/db.ts", () => ({
    db: { orm: { public: mockModels }, transaction: mockTransaction },
}))

const { keuanganService } = await import("../src/services/keuangan.service.ts")

const input = {
    jenis_keuangan: "PENGELUARAN" as const,
    tanggal: "2026-11-10",
    keterangan: "Pembelian alat kebersihan",
    detail: [
        { nominal: "10000", keterangan: "Sapu" },
        { nominal: "5000", keterangan: "Pengki" },
    ],
}

beforeEach(() => {
    mockFirst.mockReset()
    mockAll.mockReset()
    mockBuatKeuangan.mockReset()
    mockBuatDetail.mockReset()
    mockBuatLedger.mockReset()
    mockWhere.mockClear()
    mockOrderBy.mockClear()
    mockTransaction.mockClear()
})

describe("KeuanganService", () => {
    describe("create", () => {
        it("menurunkan total jurnal dari rincian dan menulis sepasang kaki ledger", async () => {
            mockBuatKeuangan.mockResolvedValue({ id: 11, jenis_keuangan: "PENGELUARAN" })
            mockBuatDetail.mockResolvedValue([{ id: 21 }, { id: 22 }])
            mockBuatLedger.mockResolvedValue([{ id: "debit" }, { id: "kredit" }])

            const hasil: any = await keuanganService.create(input, 1, 9)

            expect(mockTransaction).toHaveBeenCalledTimes(1)
            expect(mockBuatKeuangan).toHaveBeenCalledWith({
                organisasi_id: 1,
                tanggal: Temporal.PlainDate.from("2026-11-10"),
                user_id: 9,
                keterangan: "Pembelian alat kebersihan",
                jenis_keuangan: "PENGELUARAN",
            })

            const detail = mockBuatDetail.mock.calls[0]?.[0] as Array<Record<string, any>>
            expect(detail).toHaveLength(2)
            expect(detail.map((baris) => baris.nominal)).toEqual(["10000", "5000"])
            // Jurnal umum tidak boleh menautkan rincian ke pembayaran iuran.
            expect(detail.every((baris) => baris.pembayaran_iuran_id === null)).toBe(true)

            const ledger = mockBuatLedger.mock.calls[0]?.[0] as Array<Record<string, any>>
            expect(ledger).toHaveLength(2)
            expect(ledger.map((kaki) => kaki.tipe)).toEqual(["DEBIT", "KREDIT"])
            // 10000 + 5000 = 15000, dibukukan sebagai bentuk kanonik 2 desimal.
            expect(ledger[0]?.nominal).toBe("15000.00")
            expect(ledger[1]?.nominal).toBe("15000.00")
            // Jurnal umum tidak punya sub organisasi maupun jejak sistem.
            expect(ledger[0]?.sub_organisasi_id).toBeNull()
            expect(ledger[0]?.system_details).toBeNull()

            expect(hasil.ledger).toHaveLength(2)
        })

        it("menyimpan keterangan null bila tidak dikirim", async () => {
            mockBuatKeuangan.mockResolvedValue({ id: 11 })
            mockBuatDetail.mockResolvedValue([])
            mockBuatLedger.mockResolvedValue([])

            await keuanganService.create(
                {
                    jenis_keuangan: "PEMASUKAN",
                    tanggal: "2026-11-10",
                    detail: [{ nominal: "25000" }],
                },
                1,
                9,
            )

            expect(mockBuatKeuangan).toHaveBeenCalledWith(
                expect.objectContaining({ keterangan: null }),
            )
            const detail = mockBuatDetail.mock.calls[0]?.[0] as Array<Record<string, any>>
            expect(detail[0]?.keterangan).toBeNull()
        })
    })

    describe("getById", () => {
        it("mengembalikan header beserta rincian aktif dan kaki ledger", async () => {
            const header = { id: 11, organisasi_id: 1, jenis_keuangan: "PENGELUARAN" }
            const detail = [{ id: 21, keuangan_id: 11, deletedAt: null }]
            const ledger = [{ id: "debit" }, { id: "kredit" }]
            mockFirst.mockResolvedValue(header)
            mockAll.mockResolvedValueOnce(detail).mockResolvedValueOnce(ledger)

            const hasil: any = await keuanganService.getById(11, 1)

            expect(mockWhere).toHaveBeenCalledWith({ id: 11, organisasi_id: 1 })
            // Rincian yang sudah dihapus tidak ikut dikembalikan.
            expect(mockWhere).toHaveBeenCalledWith({ keuangan_id: 11, deletedAt: null })
            expect(mockWhere).toHaveBeenCalledWith({ keuangan_id: 11 })
            expect(hasil.detail).toHaveLength(1)
            expect(hasil.ledger).toHaveLength(2)
        })

        it("melempar 404 saat jurnal bukan milik organisasi tenant", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(keuanganService.getById(11, 7)).rejects.toThrow(
                new NotFoundError("Transaksi keuangan tidak ditemukan.", {
                    code: "KEUANGAN.NOT_FOUND",
                }),
            )
            expect(mockWhere).toHaveBeenCalledWith({ id: 11, organisasi_id: 7 })
            expect(mockAll).not.toHaveBeenCalled()
        })
    })

    describe("getAll", () => {
        it("membatasi query ke organisasi tenant", async () => {
            mockAll.mockResolvedValue([])

            await keuanganService.getAll(1)

            expect(mockWhere).toHaveBeenCalledWith({ organisasi_id: 1 })
            expect(mockOrderBy).toHaveBeenCalledTimes(2)
        })

        it("menambahkan predikat tanggal hanya bila filter dikirim", async () => {
            mockAll.mockResolvedValue([])

            await keuanganService.getAll(1, { dari: "2026-11-01", sampai: "2026-11-30" })

            // (1) scope tenant, (2) batas bawah, (3) batas atas.
            expect(mockWhere).toHaveBeenCalledTimes(3)
        })
    })
})
