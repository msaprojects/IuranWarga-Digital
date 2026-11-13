const keuanganPaths = {
    "/keuangan": {
        get: {
            tags: ["Keuangan"],
            summary: "Daftar jurnal keuangan",
            description:
                "Mengembalikan header jurnal pada organisasi pemanggil, tanggal terbaru lebih dulu. Rincian dan kaki ledger tidak disertakan — ambil lewat detail.",
            operationId: "getAllKeuangan",
            parameters: [
                {
                    name: "jenis_keuangan",
                    in: "query",
                    required: false,
                    description: "Saring berdasarkan jenis jurnal.",
                    schema: { type: "string", enum: ["PEMASUKAN", "PENGELUARAN"] },
                },
                {
                    name: "dari",
                    in: "query",
                    required: false,
                    description: "Batas bawah tanggal jurnal (YYYY-MM-DD, inklusif).",
                    schema: { type: "string", format: "date" },
                },
                {
                    name: "sampai",
                    in: "query",
                    required: false,
                    description: "Batas atas tanggal jurnal (YYYY-MM-DD, inklusif).",
                    schema: { type: "string", format: "date" },
                },
            ],
            responses: {
                "200": {
                    description: "Daftar jurnal berhasil diambil.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/KeuanganListSuccess" },
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
        post: {
            tags: ["Keuangan"],
            summary: "Buat jurnal keuangan umum",
            description:
                "Mencatat jurnal PEMASUKAN/PENGELUARAN beserta rinciannya. Total jurnal diturunkan dari penjumlahan nominal rincian, dan setiap jurnal otomatis menghasilkan sepasang kaki ledger DEBIT + KREDIT. Jalur ini untuk jurnal umum; pemasukan dari pembayaran iuran hanya masuk lewat posting pembayaran.",
            operationId: "createKeuangan",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/CreateKeuanganInput" },
                    },
                },
            },
            responses: {
                "201": {
                    description: "Jurnal berhasil dicatat.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/KeuanganDetailSuccess" },
                        },
                    },
                },
                "400": {
                    description: "Body tidak valid.",
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
    "/keuangan/{id}": {
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                description: "ID jurnal keuangan (bilangan bulat positif).",
                schema: { type: "integer", minimum: 1 },
                example: 1,
            },
        ],
        get: {
            tags: ["Keuangan"],
            summary: "Detail jurnal keuangan",
            description:
                "Mengembalikan satu header jurnal beserta rincian aktif (`deletedAt` null) dan seluruh kaki ledger-nya.",
            operationId: "getKeuanganById",
            responses: {
                "200": {
                    description: "Jurnal ditemukan.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/KeuanganDetailSuccess" },
                        },
                    },
                },
                "400": {
                    description: "id tidak valid.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "404": {
                    description: "Jurnal tidak ditemukan pada organisasi pemanggil.",
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

export default keuanganPaths
