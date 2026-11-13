import { STATUS_PEMBAYARAN } from "../../../utils/constanta.ts"

// `nominal_bayar` adalah kolom Decimal, jadi direpresentasikan sebagai string
// di kontrak API agar presisi tidak hilang.
const pembayaranIuranSchemas = {
    CreatePembayaranIuranInput: {
        type: "object",
        additionalProperties: false,
        required: ["tagihan_iuran_id", "nominal_bayar", "tanggal_bayar"],
        properties: {
            tagihan_iuran_id: {
                type: "integer",
                minimum: 1,
                description: "ID tagihan yang dibayar pada organisasi pemanggil.",
                example: 1,
            },
            nominal_bayar: {
                type: "string",
                pattern: "^\\d+(\\.\\d{1,2})?$",
                description:
                    "Nominal pembayaran (string Decimal, maksimal 2 desimal). Tidak boleh melebihi sisa tagihan.",
                example: "50000",
            },
            tanggal_bayar: {
                type: "string",
                format: "date",
                description: "Tanggal pembayaran diterima (YYYY-MM-DD).",
                example: "2026-11-10",
            },
        },
        example: {
            tagihan_iuran_id: 1,
            nominal_bayar: "50000",
            tanggal_bayar: "2026-11-10",
        },
    },
    PostingPembayaranIuranInput: {
        type: "object",
        additionalProperties: false,
        properties: {
            keterangan: {
                type: "string",
                minLength: 3,
                maxLength: 255,
                description:
                    "Keterangan jurnal keuangan. Bila kosong, dipakai `Pembayaran <nomor_transaksi>`.",
                example: "Setoran iuran bulan Oktober",
            },
        },
        example: { keterangan: "Setoran iuran bulan Oktober" },
    },
    PembayaranIuran: {
        type: "object",
        properties: {
            id: { type: "integer", example: 1 },
            nomor_transaksi: { type: "string", example: "PAY-202610-1AB12" },
            organisasi_id: { type: "integer", example: 1 },
            tagihan_iuran_id: { type: "integer", example: 1 },
            jenis_iuran_id: { type: "integer", example: 1 },
            peserta_id: { type: "integer", example: 1 },
            nominal_bayar: { type: "string", example: "50000" },
            tanggal_bayar: { type: "string", format: "date", example: "2026-11-10" },
            status: {
                type: "string",
                enum: [...STATUS_PEMBAYARAN],
                description:
                    "BERHASIL = tercatat; CANCELLED = dibatalkan sebelum diposting; REFUNDED = dikembalikan.",
                example: "BERHASIL",
            },
            user_id: { type: "integer", nullable: true, example: 1 },
            postedAt: {
                type: "string",
                format: "date-time",
                nullable: true,
                description:
                    "Waktu pembayaran masuk buku keuangan. `null` = belum diposting (masih boleh dibatalkan).",
                example: null,
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },
    PembayaranIuranSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { $ref: "#/components/schemas/PembayaranIuran" },
        },
    },
    PembayaranIuranListSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { type: "array", items: { $ref: "#/components/schemas/PembayaranIuran" } },
        },
    },
} as const

export default pembayaranIuranSchemas
