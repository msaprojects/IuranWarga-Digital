const organisasiPaths = {
    "/organisasi": {
        post: {
            tags: ["Organisasi"],
            security: [],
            summary: "Buat organisasi",
            description:
                "Membuat organisasi beserta user admin pertamanya. Role ADMIN dan organisasi_id ditentukan oleh server. Field opsional yang tidak dikirim akan menggunakan nilai default null (atau true untuk isActive).",
            operationId: "createOrganisasi",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/CreateOrganisasiWithUserInput" },
                    },
                },
            },
            responses: {
                "201": {
                    description: "Organisasi berhasil dibuat",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/OrganisasiSuccess" },
                        },
                    },
                },
                "400": {
                    description: "Body tidak valid",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "409": {
                    description: "Kode organisasi atau username sudah digunakan",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                        },
                    },
                },
                "500": {
                    description: "Kesalahan server",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                        },
                    },
                },
            },
        },
    },
    "/organisasi/{kode}": {
        parameters: [
            {
                name: "kode",
                in: "path",
                required: true,
                description: "Kode organisasi, minimal 6 dan maksimal 8 karakter.",
                schema: { type: "string", minLength: 6, maxLength: 8 },
                example: "ORG001",
            },
        ],
        get: {
            tags: ["Organisasi"],
            summary: "Ambil organisasi berdasarkan kode",
            operationId: "getOrganisasiByKode",
            responses: {
                "401": { $ref: "#/components/responses/Unauthorized" },
                "200": {
                    description: "Organisasi ditemukan dan masih aktif",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/OrganisasiSuccess" },
                        },
                    },
                },
                "400": {
                    description: "Kode tidak valid",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "404": {
                    description: "Organisasi tidak ditemukan atau tidak aktif",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                        },
                    },
                },
                "500": {
                    description: "Kesalahan server",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                        },
                    },
                },
            },
        },
        patch: {
            tags: ["Organisasi"],
            summary: "Perbarui organisasi",
            description:
                "Memperbarui satu atau lebih field. Minimal satu field harus dikirim. isActive tidak dapat diubah lewat endpoint ini; gunakan DELETE untuk menonaktifkan.",
            operationId: "updateOrganisasi",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/UpdateOrganisasiInput" },
                        example: { nama: "Warga Harmoni Baru" },
                    },
                },
            },
            responses: {
                "401": { $ref: "#/components/responses/Unauthorized" },
                "200": {
                    description: "Organisasi berhasil diperbarui",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/OrganisasiSuccess" },
                        },
                    },
                },
                "400": {
                    description: "Kode atau body tidak valid",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "409": {
                    description: "Kode organisasi sudah digunakan.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                        },
                    },
                },
                "404": {
                    description: "Organisasi tidak ditemukan atau tidak aktif",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                        },
                    },
                },
                "500": {
                    description: "Kesalahan server",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                        },
                    },
                },
            },
        },
        delete: {
            tags: ["Organisasi"],
            summary: "Nonaktifkan organisasi",
            description:
                "Soft delete: mengubah isActive menjadi false. Data tidak dihapus permanen.",
            operationId: "deactivateOrganisasi",
            responses: {
                "401": { $ref: "#/components/responses/Unauthorized" },
                "200": {
                    description: "Organisasi berhasil dinonaktifkan",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/OrganisasiSuccess" },
                        },
                    },
                },
                "400": {
                    description: "Kode tidak valid",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "404": {
                    description: "Organisasi tidak ditemukan atau sudah nonaktif",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                        },
                    },
                },
                "500": {
                    description: "Kesalahan server",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                        },
                    },
                },
            },
        },
    },
} as const

export default organisasiPaths
