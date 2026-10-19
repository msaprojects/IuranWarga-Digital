const detailPesertaPaths = {
    "/detail-peserta-by-peserta/{peserta_id}": {
        parameters: [
            {
                name: "peserta_id",
                in: "path",
                required: true,
                description: "ID peserta induk (bilangan bulat positif).",
                schema: { type: "integer", minimum: 1 },
                example: 10,
            },
        ],
        get: {
            tags: ["Detail Peserta"],
            summary: "Daftar anggota keluarga berdasarkan peserta",
            description:
                "Mengembalikan seluruh detail peserta (anggota keluarga) yang terkait dengan satu peserta.",
            operationId: "getDetailPesertaByPesertaID",
            responses: {
                "200": {
                    description: "Daftar detail peserta berhasil diambil.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/DetailPesertaListSuccess" },
                        },
                    },
                },
                "400": {
                    description: "peserta_id tidak valid.",
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
                "500": {
                    description: "Kesalahan server.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
            },
        },
    },
    "/detail-peserta/{id}": {
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                description: "ID detail peserta (bilangan bulat positif).",
                schema: { type: "integer", minimum: 1 },
                example: 1,
            },
        ],
        get: {
            tags: ["Detail Peserta"],
            summary: "Detail peserta berdasarkan id",
            operationId: "getDetailPesertaById",
            responses: {
                "200": {
                    description: "Detail peserta ditemukan.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/DetailPesertaSuccess" },
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
                "500": {
                    description: "Kesalahan server.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
            },
        },
        patch: {
            tags: ["Detail Peserta"],
            summary: "Perbarui detail peserta",
            description:
                "Memperbarui satu atau lebih field. Semua field opsional; field yang tidak dikirim dipertahankan sesuai data tersimpan.",
            operationId: "updateDetailPeserta",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/UpdateDetailPesertaInput" },
                    },
                },
            },
            responses: {
                "200": {
                    description: "Detail peserta berhasil diperbarui.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/DetailPesertaSuccess" },
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
                "500": {
                    description: "Kesalahan server.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
            },
        },
        delete: {
            tags: ["Detail Peserta"],
            summary: "Hapus detail peserta",
            operationId: "deleteDetailPeserta",
            responses: {
                "200": {
                    description: "Detail peserta berhasil dihapus.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/DetailPesertaSuccess" },
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
                "500": {
                    description: "Kesalahan server.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
            },
        },
    },
    "/detail-peserta": {
        post: {
            tags: ["Detail Peserta"],
            summary: "Buat detail peserta",
            description:
                "Membuat anggota keluarga (detail peserta) yang terkait dengan sebuah peserta. peserta_id wajib merujuk ke peserta yang aktif.",
            operationId: "createDetailPeserta",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/CreateDetailPesertaInput" },
                    },
                },
            },
            responses: {
                "201": {
                    description: "Detail peserta berhasil dibuat.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/DetailPesertaSuccess" },
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
                    description: "Peserta tujuan tidak ditemukan atau tidak aktif.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
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

export default detailPesertaPaths
