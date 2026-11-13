const komponenSubOrganisasiPaths = {
    "/sub-organisasi/{sub_organisasi_id}/komponen": {
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
            tags: ["Komponen Sub Organisasi"],
            summary: "Daftar komponen iuran sub organisasi",
            description:
                "Mengembalikan seluruh override tarif jenis iuran milik satu sub organisasi, termasuk baris yang nonaktif (lihat field isActive).",
            operationId: "getKomponenSubOrganisasi",
            responses: {
                "200": {
                    description: "Daftar komponen berhasil diambil.",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/KomponenSubOrganisasiListSuccess",
                            },
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
            tags: ["Komponen Sub Organisasi"],
            summary: "Buat override tarif sub organisasi",
            description:
                "Menetapkan tarif khusus satu jenis iuran untuk sub organisasi ini. Jenis iuran wajib aktif dan milik organisasi yang sama dengan token; pasangan sub organisasi + jenis iuran unik.",
            operationId: "createKomponenSubOrganisasi",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/CreateKomponenSubOrganisasiInput" },
                    },
                },
            },
            responses: {
                "201": {
                    description: "Komponen berhasil dibuat.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/KomponenSubOrganisasiSuccess" },
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
                    description:
                        "Sub organisasi induk atau jenis iuran tidak ditemukan / nonaktif.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
                "409": {
                    description: "Jenis iuran sudah dikonfigurasi untuk sub organisasi ini.",
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
    "/sub-komponen/{id}": {
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                description: "ID baris komponen sub organisasi.",
                schema: { type: "integer", minimum: 1 },
                example: 1,
            },
        ],
        patch: {
            tags: ["Komponen Sub Organisasi"],
            summary: "Ubah nominal atau status komponen",
            description:
                "Memperbarui `nominal` dan/atau `isActive`. Pasangan sub organisasi + jenis iuran bersifat identitas dan tidak dapat dipindah lewat PATCH.",
            operationId: "updateKomponenSubOrganisasi",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/UpdateKomponenSubOrganisasiInput" },
                    },
                },
            },
            responses: {
                "200": {
                    description: "Komponen berhasil diperbarui.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/KomponenSubOrganisasiSuccess" },
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
                    description:
                        "Komponen tidak ditemukan atau sub organisasi induknya bukan milik tenant.",
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
            tags: ["Komponen Sub Organisasi"],
            summary: "Hapus komponen sub organisasi",
            description:
                "Menghapus override tarif secara permanen. Unique (sub_organisasi_id, jenis_iuran_id) akan menolak konfigurasi ulang bila baris hanya dinonaktifkan; gunakan PATCH `isActive: false` bila override ingin dihentikan tanpa dihapus.",
            operationId: "deleteKomponenSubOrganisasi",
            responses: {
                "200": {
                    description: "Komponen berhasil dihapus.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/KomponenSubOrganisasiSuccess" },
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
                    description:
                        "Komponen tidak ditemukan atau sub organisasi induknya bukan milik tenant.",
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

export default komponenSubOrganisasiPaths
