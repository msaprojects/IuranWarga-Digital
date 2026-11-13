import { JENIS_KEUANGAN, LEDGER_SIGN } from "../../../utils/constanta.ts"

// Seluruh nominal adalah kolom Decimal: dikirim dan diterima sebagai string
// agar tidak kehilangan presisi.
const keuanganSchemas = {
    CreateKeuanganInput: {
        type: "object",
        additionalProperties: false,
        required: ["jenis_keuangan", "tanggal", "detail"],
        properties: {
            jenis_keuangan: {
                type: "string",
                enum: [...JENIS_KEUANGAN],
                description: "PEMASUKAN menambah saldo, PENGELUARAN mengurangi saldo.",
                example: "PENGELUARAN",
            },
            tanggal: {
                type: "string",
                format: "date",
                description: "Tanggal jurnal (YYYY-MM-DD).",
                example: "2026-11-10",
            },
            keterangan: {
                type: "string",
                maxLength: 255,
                description: "Keterangan header jurnal.",
                example: "Pembelian alat kebersihan",
            },
            detail: {
                type: "array",
                minItems: 1,
                maxItems: 50,
                description:
                    "Rincian jurnal. Total jurnal diturunkan dari penjumlahan nominal, bukan dikirim terpisah.",
                items: { $ref: "#/components/schemas/KeuanganDetailInput" },
            },
        },
        example: {
            jenis_keuangan: "PENGELUARAN",
            tanggal: "2026-11-10",
            keterangan: "Pembelian alat kebersihan",
            detail: [{ nominal: "150000", keterangan: "Sapu dan pengki" }],
        },
    },
    KeuanganDetailInput: {
        type: "object",
        additionalProperties: false,
        required: ["nominal"],
        properties: {
            nominal: {
                type: "string",
                pattern: "^\\d+(\\.\\d{1,2})?$",
                description: "Nominal rincian (string Decimal, maksimal 2 desimal).",
                example: "150000",
            },
            keterangan: { type: "string", maxLength: 255, example: "Sapu dan pengki" },
        },
    },
    Keuangan: {
        type: "object",
        properties: {
            id: { type: "integer", example: 1 },
            organisasi_id: { type: "integer", example: 1 },
            tanggal: { type: "string", format: "date", example: "2026-11-10" },
            user_id: { type: "integer", nullable: true, example: 1 },
            keterangan: { type: "string", nullable: true },
            jenis_keuangan: {
                type: "string",
                enum: [...JENIS_KEUANGAN],
                example: "PENGELUARAN",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },
    KeuanganDetail: {
        type: "object",
        properties: {
            id: { type: "integer", example: 1 },
            keuangan_id: { type: "integer", example: 1 },
            nominal: { type: "string", example: "150000" },
            pembayaran_iuran_id: {
                type: "integer",
                nullable: true,
                description:
                    "Terisi bila rincian lahir dari posting pembayaran iuran; `null` untuk jurnal umum.",
                example: null,
            },
            keterangan: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },
    TransactionLedger: {
        type: "object",
        description:
            "Satu kaki buku besar. Setiap jurnal menulis sepasang DEBIT + KREDIT dengan nominal sama.",
        properties: {
            id: { type: "string", format: "uuid", example: "0192f0c4-8f0a-7c31-9a5e-2f6c1d4b8e70" },
            keuangan_id: { type: "integer", example: 1 },
            organisasi_id: { type: "integer", example: 1 },
            user_id: { type: "integer", nullable: true, example: 1 },
            sub_organisasi_id: { type: "integer", nullable: true, example: null },
            nominal: { type: "string", example: "150000" },
            tipe: { type: "string", enum: [...LEDGER_SIGN], example: "DEBIT" },
            system_details: {
                type: "string",
                nullable: true,
                description: "Jejak asal jurnal (JSON string), mis. nomor transaksi pembayaran.",
            },
            createdAt: { type: "string", format: "date-time" },
        },
    },
    KeuanganSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { $ref: "#/components/schemas/Keuangan" },
        },
    },
    KeuanganDetailSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: {
                description: "Header jurnal beserta rincian dan kaki ledger-nya.",
                allOf: [
                    { $ref: "#/components/schemas/Keuangan" },
                    {
                        type: "object",
                        properties: {
                            detail: {
                                type: "array",
                                items: { $ref: "#/components/schemas/KeuanganDetail" },
                            },
                            ledger: {
                                type: "array",
                                items: { $ref: "#/components/schemas/TransactionLedger" },
                            },
                        },
                    },
                ],
            },
        },
    },
    KeuanganListSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { type: "array", items: { $ref: "#/components/schemas/Keuangan" } },
        },
    },
} as const

export default keuanganSchemas
