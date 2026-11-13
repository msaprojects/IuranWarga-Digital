const subOrganisasiPaths = {
    "/sub-organisasi": {
        get: {
            tags: ["Sub Organisasi"],
            summary: "Daftar sub organisasi milik tenant",
            description:
                "Mengembalikan seluruh sub organisasi pada organisasi pemilik token, TERMASUK yang nonaktif, agar baris nonaktif masih bisa diaktifkan kembali. organisasi_id selalu diambil dari token, bukan dari request.",
            operationId: "getSubOrganisasiByOrganisasi",
            responses: {
                "200": {
                    description: "Daftar sub organisasi berhasil diambil.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/SubOrganisasiListSuccess" },
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
            tags: ["Sub Organisasi"],
            summary: "Buat sub organisasi",
            description:
                "Membuat sub organisasi baru pada organisasi pemilik token. Nama wajib unik di dalam organisasi (termasuk terhadap sub organisasi nonaktif).",
            operationId: "createSubOrganisasi",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/CreateSubOrganisasiInput" },
                    },
                },
            },
            responses: {
                "201": {
                    description: "Sub organisasi berhasil dibuat.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/SubOrganisasiSuccess" },
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
                "403": {
                    description: "Body menyebut organisasi_id yang berbeda dari tenant token.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
                "409": {
                    description: "Nama sub organisasi sudah dipakai.",
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
    "/sub-organisasi/{id}": {
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                description: "ID sub organisasi (bilangan bulat positif).",
                schema: { type: "integer", minimum: 1 },
                example: 1,
            },
        ],
        get: {
            tags: ["Sub Organisasi"],
            summary: "Detail sub organisasi",
            description:
                "Mengembalikan satu sub organisasi milik tenant. Baris nonaktif tetap dapat dibaca.",
            operationId: "getSubOrganisasiById",
            responses: {
                "200": {
                    description: "Sub organisasi ditemukan.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/SubOrganisasiSuccess" },
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
                "401": { $ref: "#/components/responses/Unauthorized" },
                "404": {
                    description: "Sub organisasi tidak ditemukan pada organisasi pemilik token.",
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
            tags: ["Sub Organisasi"],
            summary: "Perbarui sub organisasi",
            description:
                "Memperbarui satu atau lebih field. Field yang tidak dikirim dipertahankan. Kirim `isActive: true` untuk mengaktifkan kembali sub organisasi yang nonaktif.",
            operationId: "updateSubOrganisasi",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/UpdateSubOrganisasiInput" },
                    },
                },
            },
            responses: {
                "200": {
                    description: "Sub organisasi berhasil diperbarui.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/SubOrganisasiSuccess" },
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
                "401": { $ref: "#/components/responses/Unauthorized" },
                "404": {
                    description: "Sub organisasi tidak ditemukan pada organisasi pemilik token.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
                "409": {
                    description: "Nama sub organisasi sudah dipakai.",
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
            tags: ["Sub Organisasi"],
            summary: "Nonaktifkan sub organisasi",
            description:
                "Soft delete: baris tidak dihapus karena dapat sudah direferensikan tagihan atau ledger keuangan. Sub organisasi hanya di-set `isActive: false` dan dapat diaktifkan kembali lewat PATCH.",
            operationId: "deactivateSubOrganisasi",
            responses: {
                "200": {
                    description: "Sub organisasi berhasil dinonaktifkan.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/SubOrganisasiSuccess" },
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
                "401": { $ref: "#/components/responses/Unauthorized" },
                "404": {
                    description: "Sub organisasi tidak ditemukan pada organisasi pemilik token.",
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

export default subOrganisasiPaths
