import { beforeEach, describe, expect, it, jest, mock } from "bun:test"
import { Temporal } from "temporal-polyfill"
import { ConflictError, NotFoundError } from "../src/utils/http_error.ts"

// Rantai query `db.orm` dipalsukan. Nama variabel diawali `mock` agar boleh
// direferensikan dari factory `mock.module`; tip `(...args: any[]) => any`
// mencegah `mockResolvedValue` menyempit ke `never` dan `toHaveBeenCalledWith`
// gagal TS2554.
const mockFirst = jest.fn<(...args: any[]) => Promise<any>>()
const mockAll = jest.fn<(...args: any[]) => Promise<any>>()
const mockUpdate = jest.fn<(...args: any[]) => Promise<any>>()
const mockAggregate = jest.fn<(...args: any[]) => Promise<any>>()
const mockBuatPembayaran = jest.fn<(...args: any[]) => Promise<any>>()
const mockBuatKeuangan = jest.fn<(...args: any[]) => Promise<any>>()
const mockBuatDetailKeuangan = jest.fn<(...args: any[]) => Promise<any>>()
const mockBuatLedger = jest.fn<(...args: any[]) => Promise<any>>()

const mockRantai: Record<string, unknown> = {
    first: mockFirst,
    all: mockAll,
    update: mockUpdate,
    aggregate: mockAggregate,
}
// `collection` bersifat chainable: `.where(cb)` mengembalikan objek yang sama
// agar pola `collection = collection.where(...)` pada service tetap jalan.
const mockOrderBy = jest.fn<(...args: any[]) => any>(() => mockRantai)
const mockWhere = jest.fn<(...args: any[]) => any>(() => mockRantai)
mockRantai.where = mockWhere
mockRantai.orderBy = mockOrderBy

const mockPembayaranIuran = { where: mockWhere, create: mockBuatPembayaran }
const mockTagihanIuran = { where: mockWhere }
const mockKeuangan = { where: mockWhere, create: mockBuatKeuangan }
const mockKeuanganDetail = { where: mockWhere, createAll: mockBuatDetailKeuangan }
const mockTransactionLedger = { where: mockWhere, createAll: mockBuatLedger }

const mockModels = {
    pembayaran_iuran: mockPembayaranIuran,
    tagihan_iuran: mockTagihanIuran,
    keuangan: mockKeuangan,
    keuangan_detail: mockKeuanganDetail,
    transaction_ledger: mockTransactionLedger,
}

// `tx` di dalam `db.transaction` memakai model yang sama: test tidak
// membedakan transaksi/komitmen, hanya urutan penulisan.
const mockTransaction = jest.fn<(...args: any[]) => Promise<any>>((fn: any) =>
    fn({ orm: { public: mockModels } }),
)

mock.module("../src/prisma/db.ts", () => ({
    db: {
        orm: { public: mockModels },
        transaction: mockTransaction,
    },
}))

const { pembayaranIuranService } = await import(
    "../src/services/pembayaran_iuran.service.ts"
)

const tagihan = {
    id: 5,
    organisasi_id: 1,
    jenis_iuran_id: 2,
    peserta_id: 3,
    tahun: 2026,
    bulan: 10,
    nominal_tagihan: "50000",
    status: "BELUM_BAYAR" as const,
}

const pembayaranLama = (overrides: Record<string, unknown> = {}) => ({
    id: 7,
    nomor_transaksi: "PAY-202610-3AB12",
    organisasi_id: 1,
    tagihan_iuran_id: 5,
    jenis_iuran_id: 2,
    peserta_id: 3,
    nominal_bayar: "20000",
    tanggal_bayar: Temporal.PlainDate.from("2026-11-10"),
    status: "BERHASIL" as const,
    user_id: 9,
    postedAt: null,
    createdAt: "2026-11-10T00:00:00.000Z",
    updatedAt: "2026-11-10T00:00:00.000Z",
    ...overrides,
})

const input = {
    tagihan_iuran_id: 5,
    nominal_bayar: "20000",
    tanggal_bayar: "2026-11-10",
}

beforeEach(() => {
    mockFirst.mockReset()
    mockAll.mockReset()
    mockUpdate.mockReset()
    mockAggregate.mockReset()
    mockBuatPembayaran.mockReset()
    mockBuatKeuangan.mockReset()
    mockBuatDetailKeuangan.mockReset()
    mockBuatLedger.mockReset()
    mockWhere.mockClear()
    mockOrderBy.mockClear()
    mockTransaction.mockClear()
})

describe("PembayaranIuranService", () => {
    describe("create", () => {
        const scopeTagihan = { id: input.tagihan_iuran_id, organisasi_id: 1, deletedAt: null }

        it("menyalin jenis_iuran_id & peserta_id dari tagihan dan menandai tagihan PARTIAL", async () => {
            mockFirst.mockResolvedValue(tagihan)
            // (1) sisa sebelum bayar, (2) sisa setelah pembayaran tersimpan.
            mockAggregate
                .mockResolvedValueOnce({ total: "0" })
                .mockResolvedValueOnce({ total: "20000" })
            const barisTersimpan: any = pembayaranLama()
            mockBuatPembayaran.mockResolvedValue(barisTersimpan)

            const result: any = await pembayaranIuranService.create(input, 1, 9)

            expect(mockWhere).toHaveBeenCalledWith(scopeTagihan)
            const payload = mockBuatPembayaran.mock.calls[0]?.[0] as Record<string, any>
            // Snapshot dari tagihan, bukan dari body.
            expect(payload.jenis_iuran_id).toBe(tagihan.jenis_iuran_id)
            expect(payload.peserta_id).toBe(tagihan.peserta_id)
            expect(payload.status).toBe("BERHASIL")
            expect(payload.user_id).toBe(9)
            expect(payload.tanggal_bayar.equals(Temporal.PlainDate.from("2026-11-10"))).toBe(true)
            expect(payload.nomor_transaksi).toMatch(/^PAY-202610-3[A-Z0-9]{4}$/)
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ status: "PARTIAL" }),
            )
            expect(result).toBe(barisTersimpan)
        })

        it("menandai tagihan SUDAH_BAYAR saat pembayaran menutup seluruh nominal", async () => {
            mockFirst.mockResolvedValue(tagihan)
            mockAggregate
                .mockResolvedValueOnce({ total: "0" })
                .mockResolvedValueOnce({ total: "50000" })
            mockBuatPembayaran.mockResolvedValue(pembayaranLama())

            await pembayaranIuranService.create(
                { ...input, nominal_bayar: "50000" },
                1,
                9,
            )

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ status: "SUDAH_BAYAR" }),
            )
        })

        it("menerima pembayaran kedua yang melunasi sisa tagihan", async () => {
            mockFirst.mockResolvedValue({ ...tagihan, status: "PARTIAL" })
            mockAggregate
                .mockResolvedValueOnce({ total: "20000" })
                .mockResolvedValueOnce({ total: "50000" })
            mockBuatPembayaran.mockResolvedValue(pembayaranLama())

            await pembayaranIuranService.create(input, 1, 9)

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ status: "SUDAH_BAYAR" }),
            )
        })

        it("menolak nominal melebihi sisa tagihan tanpa menulis apa pun", async () => {
            mockFirst.mockResolvedValue(tagihan)
            mockAggregate.mockResolvedValue({ total: "20000" })

            await expect(
                pembayaranIuranService.create({ ...input, nominal_bayar: "40000" }, 1, 9),
            ).rejects.toThrow(
                new ConflictError("Nominal pembayaran melebihi sisa tagihan.", {
                    code: "PEMBAYARAN.MELEBIHI_SISA",
                }),
            )
            expect(mockBuatPembayaran).not.toHaveBeenCalled()
            expect(mockUpdate).not.toHaveBeenCalled()
        })

        it("menolak pembayaran pada tagihan yang sudah lunas", async () => {
            mockFirst.mockResolvedValue({ ...tagihan, status: "SUDAH_BAYAR" })
            mockAggregate.mockResolvedValue({ total: "50000" })

            await expect(pembayaranIuranService.create(input, 1, 9)).rejects.toThrow(
                new ConflictError("Tagihan sudah lunas.", {
                    code: "PEMBAYARAN.TAGIHAN_LUNAS",
                }),
            )
            expect(mockBuatPembayaran).not.toHaveBeenCalled()
        })

        it("menolak pembayaran pada tagihan CANCELLED", async () => {
            mockFirst.mockResolvedValue({ ...tagihan, status: "CANCELLED" })

            await expect(pembayaranIuranService.create(input, 1, 9)).rejects.toThrow(
                new ConflictError("Tagihan sudah dibatalkan.", { code: "TAGIHAN.CANCELLED" }),
            )
            expect(mockAggregate).not.toHaveBeenCalled()
            expect(mockBuatPembayaran).not.toHaveBeenCalled()
        })

        it("melempar 404 saat tagihan bukan milik organisasi tenant", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(pembayaranIuranService.create(input, 7, 9)).rejects.toThrow(
                new NotFoundError("Tagihan iuran tidak ditemukan.", {
                    code: "TAGIHAN.NOT_FOUND",
                }),
            )
            expect(mockWhere).toHaveBeenCalledWith({ ...scopeTagihan, organisasi_id: 7 })
            expect(mockBuatPembayaran).not.toHaveBeenCalled()
        })
    })

    describe("cancel", () => {
        const scope = { id: 7, organisasi_id: 1 }

        it("membatalkan pembayaran dan mengembalikan tagihan ke BELUM_BAYAR", async () => {
            // Tagihan harus PARTIAL agar transisi ke BELUM_BAYAR benar-benar menulis.
            mockFirst
                .mockResolvedValueOnce(pembayaranLama())
                .mockResolvedValueOnce({ ...tagihan, status: "PARTIAL" })
            mockAggregate.mockResolvedValue({ total: "0" })
            mockUpdate.mockResolvedValue(pembayaranLama({ status: "CANCELLED" }))

            await pembayaranIuranService.cancel(7, 1)

            expect(mockWhere).toHaveBeenCalledWith(scope)
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ status: "CANCELLED" }),
            )
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ status: "BELUM_BAYAR" }),
            )
        })

        it("menolak pembatalan pembayaran yang sudah diposting", async () => {
            mockFirst.mockResolvedValue(
                pembayaranLama({ postedAt: "2026-11-10T05:00:00.000Z" }),
            )

            await expect(pembayaranIuranService.cancel(7, 1)).rejects.toThrow(
                new ConflictError(
                    "Pembayaran sudah diposting ke buku keuangan; koreksi harus lewat jurnal balik.",
                    { code: "PEMBAYARAN.SUDAH_DIPOSTING" },
                ),
            )
            expect(mockUpdate).not.toHaveBeenCalled()
        })

        it("menolak pembatalan pembayaran yang tidak berstatus BERHASIL", async () => {
            mockFirst.mockResolvedValue(pembayaranLama({ status: "CANCELLED" }))

            await expect(pembayaranIuranService.cancel(7, 1)).rejects.toThrow(
                new ConflictError("Hanya pembayaran berstatus BERHASIL yang dapat dibatalkan.", {
                    code: "PEMBAYARAN.TIDAK_BERHASIL",
                }),
            )
            expect(mockUpdate).not.toHaveBeenCalled()
        })

        it("melempar 404 saat pembayaran bukan milik organisasi tenant", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(pembayaranIuranService.cancel(7, 7)).rejects.toThrow(
                new NotFoundError("Pembayaran iuran tidak ditemukan.", {
                    code: "PEMBAYARAN.NOT_FOUND",
                }),
            )
            expect(mockWhere).toHaveBeenCalledWith({ id: 7, organisasi_id: 7 })
        })
    })

    describe("posting", () => {
        it("menulis jurnal PEMASUKAN, rincian, dan sepasang kaki ledger dalam satu transaksi", async () => {
            mockFirst.mockResolvedValueOnce(pembayaranLama()).mockResolvedValueOnce({
                ...tagihan,
                sub_organisasi_id: 4,
            })
            mockBuatKeuangan.mockResolvedValue({ id: 11, jenis_keuangan: "PEMASUKAN" })
            mockBuatDetailKeuangan.mockResolvedValue([{ id: 21 }])
            mockBuatLedger.mockResolvedValue([{ id: "ledger-1" }, { id: "ledger-2" }])

            const hasil: any = await pembayaranIuranService.posting(7, 1, 9)

            expect(mockTransaction).toHaveBeenCalledTimes(1)

            const jurnal = mockBuatKeuangan.mock.calls[0]?.[0] as Record<string, any>
            expect(jurnal.jenis_keuangan).toBe("PEMASUKAN")
            expect(jurnal.organisasi_id).toBe(1)
            expect(jurnal.user_id).toBe(9)
            expect(jurnal.keterangan).toBe("Pembayaran PAY-202610-3AB12")

            const detail = mockBuatDetailKeuangan.mock.calls[0]?.[0] as Array<
                Record<string, any>
            >
            expect(detail).toHaveLength(1)
            expect(detail[0]?.nominal).toBe("20000")
            // Rincian jurnal harus menunjuk balik ke pembayaran asalnya.
            expect(detail[0]?.pembayaran_iuran_id).toBe(7)

            const ledger = mockBuatLedger.mock.calls[0]?.[0] as Array<Record<string, any>>
            expect(ledger).toHaveLength(2)
            expect(ledger.map((kaki) => kaki.tipe)).toEqual(["DEBIT", "KREDIT"])
            // Total ledger memakai bentuk kanonik 2 desimal hasil `fromCents`.
            expect(ledger[0]?.nominal).toBe("20000.00")
            expect(ledger[1]?.nominal).toBe("20000.00")
            // Sub organisasi diteruskan dari tagihan ke setiap kaki ledger.
            expect(ledger[0]?.sub_organisasi_id).toBe(4)

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ postedAt: expect.any(String) }),
            )
            expect(hasil.ledger).toHaveLength(2)
        })

        it("memakai keterangan kustom dari body bila dikirim", async () => {
            mockFirst.mockResolvedValueOnce(pembayaranLama()).mockResolvedValueOnce(tagihan)
            mockBuatKeuangan.mockResolvedValue({ id: 11 })
            mockBuatDetailKeuangan.mockResolvedValue([{ id: 21 }])
            mockBuatLedger.mockResolvedValue([])

            await pembayaranIuranService.posting(7, 1, 9, "Setoran iuran Oktober")

            expect(mockBuatKeuangan).toHaveBeenCalledWith(
                expect.objectContaining({ keterangan: "Setoran iuran Oktober" }),
            )
        })

        it("menolak posting kedua kali", async () => {
            mockFirst.mockResolvedValue(
                pembayaranLama({ postedAt: "2026-11-10T05:00:00.000Z" }),
            )

            await expect(pembayaranIuranService.posting(7, 1, 9)).rejects.toThrow(
                new ConflictError("Pembayaran sudah pernah diposting.", {
                    code: "PEMBAYARAN.SUDAH_DIPOSTING",
                }),
            )
            expect(mockBuatKeuangan).not.toHaveBeenCalled()
            expect(mockUpdate).not.toHaveBeenCalled()
        })

        it("menolak posting pembayaran yang tidak berstatus BERHASIL", async () => {
            mockFirst.mockResolvedValue(pembayaranLama({ status: "CANCELLED" }))

            await expect(pembayaranIuranService.posting(7, 1, 9)).rejects.toThrow(
                new ConflictError("Pembayaran tidak berstatus BERHASIL.", {
                    code: "PEMBAYARAN.TIDAK_BERHASIL",
                }),
            )
            expect(mockBuatKeuangan).not.toHaveBeenCalled()
        })

        it("melempar 404 saat pembayaran bukan milik organisasi tenant", async () => {
            mockFirst.mockResolvedValue(null)

            await expect(pembayaranIuranService.posting(7, 7, 9)).rejects.toThrow(
                new NotFoundError("Pembayaran iuran tidak ditemukan.", {
                    code: "PEMBAYARAN.NOT_FOUND",
                }),
            )
            expect(mockBuatKeuangan).not.toHaveBeenCalled()
        })
    })

    describe("getAll", () => {
        it("membatasi query ke organisasi tenant walau tanpa filter", async () => {
            mockAll.mockResolvedValue([])

            await pembayaranIuranService.getAll(1)

            expect(mockWhere).toHaveBeenCalledWith({ organisasi_id: 1 })
            expect(mockOrderBy).toHaveBeenCalledTimes(2)
        })

        it("menyusun predikat hanya dari filter yang dikirim", async () => {
            mockAll.mockResolvedValue([])

            await pembayaranIuranService.getAll(1, {
                tagihan_iuran_id: 5,
                status: "BERHASIL",
            })

            expect(mockWhere).toHaveBeenCalledWith({
                organisasi_id: 1,
                tagihan_iuran_id: 5,
                status: "BERHASIL",
            })
            // Tepat satu `.where()`: filter tanggal tidak dikirim.
            expect(mockWhere).toHaveBeenCalledTimes(1)
        })
    })
})
