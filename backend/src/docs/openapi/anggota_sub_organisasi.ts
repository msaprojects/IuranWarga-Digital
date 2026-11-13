const anggotaSubOrganisasiPaths = {
    "/sub-organisasi/{sub_organisasi_id}/anggota": {
        parameters: [
            {
                name: "sub_organisasi_id",
                in: "path",
                required: true,
                description: "ID sub organisasi induk (harus aktif dan milik tenant token).",
                schema: { type: "integer", minimum: 1 },
                example: 1,
            },
        ],
        get: {
            tags: ["Anggota Sub Organisasi"],
            summary: "Daftar anggota sub organisasi",
            description:
                "Mengembalikan seluruh keanggotaan peserta pada satu sub organisasi, termasuk baris yang nonaktif (lihat field isActive).",
            operationId: "getAnggotaSubOrganisasi",
            responses: {
                "200": {
                    description: "Daftar anggota berhasil diambil.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/AnggotaSubOrganisasiListSuccess" },
                        },
                    },
                },
                "400": {
                    description: "sub_organisasi_id tidak valid.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "401": { $ref: "#/components/responses/Unauthorized" },
                "404": {
                    description: "Sub organisasi induk tidak ditemukan / nonaktif pada tenant ini.",
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
        post: {
            tags: ["Anggota Sub Organisasi"],
            summary: "Tambahkan peserta ke sub organisasi",
            description:
                "Mendaftarkan satu peserta aktif ke sub organisasi. Peserta wajib berada di organisasi yang sama dengan token; pasangan sub organisasi + peserta unik.",
            operationId: "createAnggotaSubOrganisasi",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/CreateAnggotaSubOrganisasiInput" },
                    },
                },
            },
            responses: {
                "201": {
                    description: "Anggota berhasil ditambahkan.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/AnggotaSubOrganisasiSuccess" },
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
                "404": {
                    description: "Sub organisasi induk atau peserta tidak ditemukan / nonaktif.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
                "409": {
                    description: "Peserta sudah terdaftar pada sub organisasi ini.",
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
    "/sub-anggota/{id}": {
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                description: "ID baris keanggotaan (bukan ID peserta).",
                schema: { type: "integer", minimum: 1 },
                example: 1,
            },
        ],
        patch: {
            tags: ["Anggota Sub Organisasi"],
            summary: "Ubah status keanggotaan",
            description:
                "Hanya `isActive` yang dapat diubah. Pasangan sub organisasi + peserta bersifat identitas; memindahkan peserta ke sub organisasi lain dilakukan dengan DELETE lalu POST.",
            operationId: "updateAnggotaSubOrganisasi",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/UpdateAnggotaSubOrganisasiInput" },
                    },
                },
            },
            responses: {
                "200": {
                    description: "Keanggotaan berhasil diperbarui.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/AnggotaSubOrganisasiSuccess" },
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
                    description: "Keanggotaan tidak ditemukan atau sub organisasi induknya bukan milik tenant.",
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
            tags: ["Anggota Sub Organisasi"],
            summary: "Hapus keanggotaan sub organisasi",
            description:
                "Menghapus baris keanggotaan secara permanen. Dipilih hard delete karena unique (sub_organisasi_id, peserta_id) akan menolak pendaftaran ulang bila baris hanya dinonaktifkan. Gunakan PATCH `isActive: false` bila riwayat ingin dipertahankan.",
            operationId: "deleteAnggotaSubOrganisasi",
            responses: {
                "200": {
                    description: "Keanggotaan berhasil dihapus.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/AnggotaSubOrganisasiSuccess" },
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
                    description: "Keanggotaan tidak ditemukan atau sub organisasi induknya bukan milik tenant.",
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

export default anggotaSubOrganisasiPaths
