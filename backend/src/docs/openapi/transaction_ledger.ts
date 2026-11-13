const transactionLedgerPaths = {
    "/transaction-ledger": {
        get: {
            tags: ["Transaction Ledger"],
            summary: "Daftar entri log transaksi",
            description:
                "Mengembalikan kaki buku besar milik organisasi pemanggil, terbaru lebih dulu. `dari`/`sampai` menapis waktu pencatatan (`createdAt`), bukan tanggal jurnal. Tanpa `limit`, dikembalikan maksimal 100 entri.",
            operationId: "getAllTransactionLedger",
            parameters: [
                {
                    name: "keuangan_id",
                    in: "query",
                    required: false,
                    description: "Saring entri milik satu jurnal.",
                    schema: { type: "integer", minimum: 1 },
                },
                {
                    name: "sub_organisasi_id",
                    in: "query",
                    required: false,
                    description: "Saring entri yang dibukukan untuk satu sub organisasi.",
                    schema: { type: "integer", minimum: 1 },
                },
                {
                    name: "tipe",
                    in: "query",
                    required: false,
                    description: "Saring kaki DEBIT atau KREDIT.",
                    schema: { type: "string", enum: ["DEBIT", "KREDIT"] },
                },
                {
                    name: "dari",
                    in: "query",
                    required: false,
                    description: "Batas bawah createdAt (YYYY-MM-DD, inklusif dari awal hari UTC).",
                    schema: { type: "string", format: "date" },
                },
                {
                    name: "sampai",
                    in: "query",
                    required: false,
                    description: "Batas atas createdAt (YYYY-MM-DD, inklusif sampai akhir hari UTC).",
                    schema: { type: "string", format: "date" },
                },
                {
                    name: "limit",
                    in: "query",
                    required: false,
                    description: "Jumlah maksimum entri (1-500, default 100).",
                    schema: { type: "integer", minimum: 1, maximum: 500, default: 100 },
                },
            ],
            responses: {
                "200": {
                    description: "Daftar entri ledger berhasil diambil.",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/TransactionLedgerListSuccess",
                            },
                        },
                    },
                },
                "400": {
                    description: "Query tidak valid.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "401": { $ref: "#/components/responses/Unauthorized" },
                "500": {
                    description: "Kesalahan server.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
            },
        },
    },
    "/transaction-ledger/{id}": {
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                description: "ID entri ledger (UUID v7).",
                schema: { type: "string", format: "uuid" },
                example: "0192f0c4-8f0a-7c31-9a5e-2f6c1d4b8e70",
            },
        ],
        get: {
            tags: ["Transaction Ledger"],
            summary: "Detail entri log transaksi",
            description:
                "Mengembalikan satu entri ledger milik organisasi pemanggil. Log tidak dapat diubah maupun dihapus.",
            operationId: "getTransactionLedgerById",
            responses: {
                "200": {
                    description: "Entri ledger ditemukan.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/TransactionLedgerSuccess" },
                        },
                    },
                },
                "400": {
                    description: "id bukan UUID yang valid.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "404": {
                    description: "Entri ledger tidak ditemukan.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
                "401": { $ref: "#/components/responses/Unauthorized" },
                "500": {
                    description: "Kesalahan server.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
            },
        },
    },
} as const

export default transactionLedgerPaths
