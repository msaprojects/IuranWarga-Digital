import { LEDGER_SIGN } from "../../../utils/constanta.ts"

// Log transaksi bersifat read-only: hanya ada skema respons, tanpa input.
const transactionLedgerSchemas = {
    TransactionLedgerEntry: {
        type: "object",
        description:
            "Satu kaki buku besar. Setiap jurnal menulis sepasang DEBIT + KREDIT dengan nominal sama.",
        properties: {
            id: {
                type: "string",
                format: "uuid",
                description: "Primary key UUID v7; urut mengikuti waktu pembuatan.",
                example: "0192f0c4-8f0a-7c31-9a5e-2f6c1d4b8e70",
            },
            keuangan_id: {
                type: "integer",
                description: "Jurnal pemilik entri ini.",
                example: 1,
            },
            organisasi_id: { type: "integer", example: 1 },
            user_id: {
                type: "integer",
                nullable: true,
                description: "Aktor pencatat; `null` untuk entri otomatis sistem.",
                example: 1,
            },
            sub_organisasi_id: { type: "integer", nullable: true, example: null },
            nominal: { type: "string", example: "150000" },
            tipe: { type: "string", enum: [...LEDGER_SIGN], example: "DEBIT" },
            system_details: {
                type: "string",
                nullable: true,
                description: "Jejak asal jurnal (JSON string), mis. nomor transaksi pembayaran.",
                example: "{\"sumber\":\"PEMBAYARAN_IURAN\",\"nomor_transaksi\":\"PAY-202610-1AB12\"}",
            },
            createdAt: { type: "string", format: "date-time" },
        },
    },
    TransactionLedgerSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { $ref: "#/components/schemas/TransactionLedgerEntry" },
        },
    },
    TransactionLedgerListSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: {
                type: "array",
                items: { $ref: "#/components/schemas/TransactionLedgerEntry" },
            },
        },
    },
} as const

export default transactionLedgerSchemas
