const jenisIuranPaths = {
    "/jenis-iuran/organisasi/{kode}": {
        parameters: [
            {
                name: "kode",
                in: "path",
                required: true,
                description: "Kode organisasi (bilangan aktif).",
                schema: { type: "string" },
                example: "ORG001",
            },
        ],
        get: {
            tags: ["Jenis Iuran"],
            summary: "Daftar jenis iuran berdasarkan kode organisasi",
            description:
                "Mengembalikan seluruh jenis iuran yang terkait dengan satu organisasi aktif.",
            operationId: "getJenisIuranByOrganisasi",
            responses: {
                "200": {
                    description: "Daftar jenis iuran berhasil diambil.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/JenisIuranListSuccess" },
                        },
                    },
                },
                "400": {
                    description: "kode tidak valid.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "404": {
                    description: "Organisasi tidak ditemukan atau sudah tidak aktif.",
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
    "/jenis-iuran/{id}": {
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                description: "ID jenis iuran (bilangan bulat positif).",
                schema: { type: "integer", minimum: 1 },
                example: 1,
            },
        ],
        get: {
            tags: ["Jenis Iuran"],
            summary: "Detail jenis iuran berdasarkan id",
            operationId: "getDetailJenisIuranByID",
            responses: {
                "200": {
                    description: "Jenis iuran ditemukan.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/JenisIuranSuccess" },
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
                    description: "Data tidak ditemukan.",
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
        patch: {
            tags: ["Jenis Iuran"],
            summary: "Perbarui jenis iuran",
            description:
                "Memperbarui satu atau lebih field. Semua field opsional; field yang tidak dikirim dipertahankan sesuai data tersimpan.",
            operationId: "updateJenisIuran",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/UpdateJenisIuranInput" },
                    },
                },
            },
            responses: {
                "200": {
                    description: "Jenis iuran berhasil diperbarui.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/JenisIuranSuccess" },
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
                    description: "Data tidak ditemukan.",
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
        delete: {
            tags: ["Jenis Iuran"],
            summary: "Hapus jenis iuran",
            operationId: "deleteJenisIuran",
            responses: {
                "200": {
                    description: "Jenis iuran berhasil dihapus.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/JenisIuranSuccess" },
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
                    description: "Data tidak ditemukan.",
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
    "/jenis-iuran": {
        post: {
            tags: ["Jenis Iuran"],
            summary: "Buat jenis iuran",
            description:
                "Membuat jenis iuran baru yang terkait dengan sebuah organisasi. organisasi_id wajib merujuk ke organisasi yang aktif.",
            operationId: "createJenisIuran",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/CreateJenisIuranInput" },
                    },
                },
            },
            responses: {
                "201": {
                    description: "Jenis iuran berhasil dibuat.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/JenisIuranSuccess" },
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
                    description: "Organisasi tujuan tidak ditemukan atau sudah tidak aktif.",
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

export default jenisIuranPaths
