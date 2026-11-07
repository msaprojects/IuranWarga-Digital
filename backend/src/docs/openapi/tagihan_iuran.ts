const tagihanIuranPaths = {
    "/tagihan-iuran/organisasi/{organisasi_id}": {
        parameters: [
            {
                name: "organisasi_id",
                in: "path",
                required: true,
                description: "ID organisasi (bilangan bulat positif).",
                schema: { type: "integer", minimum: 1 },
                example: 1,
            },
        ],
        get: {
            tags: ["Tagihan Iuran"],
            summary: "Daftar tagihan iuran berdasarkan organisasi",
            description:
                "Mengembalikan seluruh tagihan iuran milik satu organisasi. Tagihan yang telah dihapus secara lunak tidak disertakan.",
            operationId: "getAllTagihanIuranByOrganisasi",
            responses: {
                "200": {
                    description: "Daftar tagihan berhasil diambil.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/TagihanIuranListSuccess" },
                        },
                    },
                },
                "400": {
                    description: "organisasi_id tidak valid.",
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
    "/tagihan-iuran/{id}": {
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                description: "ID tagihan iuran (bilangan bulat positif).",
                schema: { type: "integer", minimum: 1 },
                example: 1,
            },
        ],
        patch: {
            tags: ["Tagihan Iuran"],
            summary: "Perbarui tagihan iuran",
            description:
                "Memperbarui periode dan nominal satu tagihan. Hanya tagihan yang belum dihapus yang dapat diperbarui.",
            operationId: "updateTagihanIuran",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/UpdateTagihanIuranInput" },
                    },
                },
            },
            responses: {
                "200": {
                    description: "Tagihan berhasil diperbarui.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/TagihanIuranSuccess" },
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
                    description: "Tagihan tidak ditemukan.",
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
            tags: ["Tagihan Iuran"],
            summary: "Hapus tagihan iuran",
            description:
                "Menghapus secara lunak (soft delete) satu tagihan berdasarkan id. Penghapus (deletedBy) diambil dari user yang terautentikasi; alasan penghapusan dikirim pada body.",
            operationId: "deleteTagihanIuran",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/DeleteTagihanIuranInput" },
                    },
                },
            },
            responses: {
                "200": {
                    description: "Tagihan berhasil dihapus.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/TagihanIuranSuccess" },
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
                    description: "Tagihan tidak ditemukan.",
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
    "/tagihan-iuran": {
        post: {
            tags: ["Tagihan Iuran"],
            summary: "Buat tagihan iuran (issuer massal manual)",
            description:
                "Menerbitkan tagihan untuk SELURUH peserta aktif pada organisasi dalam satu periode (tahun + bulan). organisasi_id dan jenis_iuran_id wajib merujuk data yang aktif. Penomoran & soft-unique per (peserta, jenis, tahun, bulan) ditangani layanan.",
            operationId: "createTagihanIuran",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/CreateTagihanIuranInput" },
                    },
                },
            },
            responses: {
                "201": {
                    description: "Tagihan berhasil diterbitkan untuk peserta aktif.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/TagihanIuranListSuccess" },
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
                    description:
                        "Organisasi / jenis iuran tidak ditemukan atau tidak ada peserta aktif.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
                "409": {
                    description: "Tagihan untuk periode tersebut sudah terbit (konflik keunikan).",
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

export default tagihanIuranPaths
