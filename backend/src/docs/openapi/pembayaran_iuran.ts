const pembayaranIuranPaths = {
    "/pembayaran-iuran": {
        get: {
            tags: ["Pembayaran Iuran"],
            summary: "Daftar pembayaran iuran",
            description:
                "Mengembalikan pembayaran pada organisasi pemanggil, terbaru lebih dulu. Seluruh query opsional: mengirim filter berarti mempersempit, bukan mengganti cakupan tenant.",
            operationId: "getAllPembayaranIuran",
            parameters: [
                {
                    name: "tagihan_iuran_id",
                    in: "query",
                    required: false,
                    description: "Saring pembayaran milik satu tagihan.",
                    schema: { type: "integer", minimum: 1 },
                },
                {
                    name: "peserta_id",
                    in: "query",
                    required: false,
                    description: "Saring pembayaran milik satu peserta.",
                    schema: { type: "integer", minimum: 1 },
                },
                {
                    name: "status",
                    in: "query",
                    required: false,
                    description: "Saring berdasarkan status pembayaran.",
                    schema: {
                        type: "string",
                        enum: ["BERHASIL", "CANCELLED", "REFUNDED"],
                    },
                },
                {
                    name: "dari",
                    in: "query",
                    required: false,
                    description: "Batas bawah tanggal_bayar (YYYY-MM-DD, inklusif).",
                    schema: { type: "string", format: "date" },
                },
                {
                    name: "sampai",
                    in: "query",
                    required: false,
                    description: "Batas atas tanggal_bayar (YYYY-MM-DD, inklusif).",
                    schema: { type: "string", format: "date" },
                },
            ],
            responses: {
                "200": {
                    description: "Daftar pembayaran berhasil diambil.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PembayaranIuranListSuccess" },
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
            tags: ["Pembayaran Iuran"],
            summary: "Catat pembayaran iuran",
            description:
                "Mencatat satu pembayaran untuk sebuah tagihan. Nominal tidak boleh melebihi sisa tagihan; `jenis_iuran_id` dan `peserta_id` disalin dari tagihan sebagai snapshot, dan status tagihan dihitung ulang dari total pembayaran BERHASIL. Histori pembayaran bersifat append-only.",
            operationId: "createPembayaranIuran",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/CreatePembayaranIuranInput" },
                    },
                },
            },
            responses: {
                "201": {
                    description: "Pembayaran berhasil dicatat.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PembayaranIuranSuccess" },
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
                "404": {
                    description: "Tagihan tidak ditemukan pada organisasi pemanggil.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
                "409": {
                    description:
                        "Tagihan dibatalkan, sudah lunas, atau nominal melebihi sisa tagihan.",
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
    "/pembayaran-iuran/{id}": {
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                description: "ID pembayaran iuran (bilangan bulat positif).",
                schema: { type: "integer", minimum: 1 },
                example: 1,
            },
        ],
        get: {
            tags: ["Pembayaran Iuran"],
            summary: "Detail pembayaran iuran",
            description: "Mengembalikan satu pembayaran milik organisasi pemanggil.",
            operationId: "getPembayaranIuranById",
            responses: {
                "200": {
                    description: "Pembayaran ditemukan.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PembayaranIuranSuccess" },
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
                    description: "Pembayaran tidak ditemukan.",
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
    "/pembayaran-iuran/{id}/cancel": {
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                description: "ID pembayaran iuran yang dibatalkan.",
                schema: { type: "integer", minimum: 1 },
                example: 1,
            },
        ],
        post: {
            tags: ["Pembayaran Iuran"],
            summary: "Batalkan pembayaran iuran",
            description:
                "Memindahkan status pembayaran menjadi CANCELLED lalu menghitung ulang status tagihan. Hanya berlaku untuk pembayaran BERHASIL yang BELUM diposting: pembayaran yang sudah masuk buku keuangan harus dikoreksi lewat jurnal balik, bukan pembatalan.",
            operationId: "cancelPembayaranIuran",
            responses: {
                "200": {
                    description: "Pembayaran berhasil dibatalkan.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PembayaranIuranSuccess" },
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
                    description: "Pembayaran tidak ditemukan.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
                "409": {
                    description:
                        "Pembayaran tidak berstatus BERHASIL, atau sudah diposting ke buku keuangan.",
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
    "/pembayaran-iuran/{id}/posting": {
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                description: "ID pembayaran iuran yang diposting.",
                schema: { type: "integer", minimum: 1 },
                example: 1,
            },
        ],
        post: {
            tags: ["Pembayaran Iuran"],
            summary: "Posting pembayaran ke buku keuangan",
            description:
                "Menulis satu jurnal PEMASUKAN (header `keuangan` + rincian + sepasang kaki ledger) lalu menandai `postedAt` pada pembayaran — seluruhnya dalam satu transaksi. Setiap pembayaran hanya dapat diposting sekali.",
            operationId: "postingPembayaranIuran",
            requestBody: {
                required: false,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/PostingPembayaranIuranInput" },
                    },
                },
            },
            responses: {
                "201": {
                    description: "Pembayaran berhasil diposting; jurnal keuangan dikembalikan.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/KeuanganDetailSuccess" },
                        },
                    },
                },
                "400": {
                    description: "id atau body tidak valid.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "404": {
                    description: "Pembayaran tidak ditemukan.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
                "409": {
                    description: "Pembayaran tidak berstatus BERHASIL atau sudah pernah diposting.",
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

export default pembayaranIuranPaths
