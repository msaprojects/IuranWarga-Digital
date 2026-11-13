import { beforeEach, describe, expect, it, jest, mock } from "bun:test"
import { NotFoundError } from "../src/utils/http_error.ts"

// Rantai query `db.orm` dipalsukan. Nama variabel diawali `mock` agar boleh
// direferensikan dari factory `mock.module`.
const mockFirst = jest.fn<(...args: any[]) => Promise<any>>()
const mockAll = jest.fn<(...args: any[]) => Promise<any>>()

const mockRantai: Record<string, unknown> = { first: mockFirst, all: mockAll }
const mockLimit = jest.fn<(...args: any[]) => any>(() => mockRantai)
const mockOrderBy = jest.fn<(...args: any[]) => any>(() => mockRantai)
const mockWhere = jest.fn<(...args: any[]) => any>(() => mockRantai)
mockRantai.where = mockWhere
mockRantai.orderBy = mockOrderBy
mockRantai.limit = mockLimit

mock.module("../src/prisma/db.ts", () => ({
    db: {
        orm: { public: { transaction_ledger: { where: mockWhere } } },
    },
}))

const { transactionLedgerService } = await import(
    "../src/services/transaction_ledger.service.ts"
)

const ledger = {
    id: "0192f0c4-8f0a-7c31-9a5e-2f6c1d4b8e70",
    keuangan_id: 11,
    organisasi_id: 1,
    user_id: 9,
    sub_organisasi_id: null,
    nominal: "150000",
    tipe: "DEBIT" as const,
    system_details: null,
    createdAt: "2026-11-10T00:00:00.000Z",
}

beforeEach(() => {
    mockFirst.mockReset()
    mockAll.mockReset()
    mockWhere.mockClear()
    mockOrderBy.mockClear()
    mockLimit.mockClear()
})

describe("TransactionLedgerService", () => {
    describe("getAll", () => {
        it("membatasi query ke organisasi tenant dengan limit default 100", async () => {
            mockAll.mockResolvedValue([ledger])

            await transactionLedgerService.getAll(1)

            expect(mockWhere).toHaveBeenCalledWith({ organisasi_id: 1 })
            expect(mockLimit).toHaveBeenCalledWith(100)
            expect(mockOrderBy).toHaveBeenCalledTimes(2)
        })

        it("meneruskan limit kustom dari klien", async () => {
            mockAll.mockResolvedValue([])

            await transactionLedgerService.getAll(1, { limit: 5 })

            expect(mockLimit).toHaveBeenCalledWith(5)
        })

        it("menyusun predikat hanya dari filter yang dikirim", async () => {
            mockAll.mockResolvedValue([])

            await transactionLedgerService.getAll(1, {
                keuangan_id: 11,
                sub_organisasi_id: 4,
                tipe: "KREDIT",
            })

            expect(mockWhere).toHaveBeenCalledWith({
                organisasi_id: 1,
                keuangan_id: 11,
                sub_organisasi_id: 4,
                tipe: "KREDIT",
            })
            expect(mockWhere).toHaveBeenCalledTimes(1)
        })

        it("menapis createdAt dengan batas eksklusif hari berikutnya untuk sampai", async () => {
            mockAll.mockResolvedValue([])

            await transactionLedgerService.getAll(1, {
                dari: "2026-11-01",
                sampai: "2026-11-30",
            })

            // (1) scope tenant + filter, (2) batas bawah, (3) batas atas.
            expect(mockWhere).toHaveBeenCalledTimes(3)
        })

        it("mengembalikan baris apa adanya dari ORM", async () => {
            mockAll.mockResolvedValue([ledger])

            const hasil: any = await transactionLedgerService.getAll(1)

            expect(hasil).toHaveLength(1)
            expect(hasil[0]).toBe(ledger)
        })
    })

    describe("getById", () => {
        it("membatasi lookup ke organisasi tenant", async () => {
            mockFirst.mockResolvedValue(ledger)

            const hasil: any = await transactionLedgerService.getById(ledger.id, 1)

            expect(mockWhere).toHaveBeenCalledWith({ id: ledger.id, organisasi_id: 1 })
            expect(hasil).toBe(ledger)
        })

        it("melempar 404 saat entri bukan milik organisasi tenant", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(transactionLedgerService.getById(ledger.id, 7)).rejects.toThrow(
                new NotFoundError("Entri log transaksi tidak ditemukan.", {
                    code: "LEDGER.NOT_FOUND",
                }),
            )
        })
    })
})
