const pengurusSubOrganisasiPaths = {
    "/sub-organisasi/{sub_organisasi_id}/pengurus": {
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
            tags: ["Pengurus Sub Organisasi"],
            summary: "Daftar pengurus (panitia) sub organisasi",
            description:
                "Mengembalikan seluruh pengurus sub organisasi beserta jabatannya, termasuk baris yang nonaktif (lihat field isActive).",
            operationId: "getPengurusSubOrganisasi",
            responses: {
                "200": {
                    description: "Daftar pengurus berhasil diambil.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PengurusSubOrganisasiListSuccess" },
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
            tags: ["Pengurus Sub Organisasi"],
            summary: "Angkat pengurus sub organisasi",
            description:
                "Mengangkat satu user aktif menjadi pengurus sub organisasi. User wajib terikat ke organisasi yang sama dengan token; pasangan sub organisasi + user unik.",
            operationId: "createPengurusSubOrganisasi",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/CreatePengurusSubOrganisasiInput" },
                    },
                },
            },
            responses: {
                "201": {
                    description: "Pengurus berhasil ditambahkan.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PengurusSubOrganisasiSuccess" },
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
                    description: "Sub organisasi induk atau user tidak ditemukan / nonaktif.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
                "409": {
                    description: "User sudah terdaftar sebagai pengurus sub organisasi ini.",
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
    "/sub-panitia/{id}": {
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                description: "ID baris pengurus (bukan ID user).",
                schema: { type: "integer", minimum: 1 },
                example: 1,
            },
        ],
        patch: {
            tags: ["Pengurus Sub Organisasi"],
            summary: "Ubah jabatan atau status pengurus",
            description:
                "Memperbarui `jabatan` dan/atau `isActive`. Pasangan sub organisasi + user bersifat identitas dan tidak dapat dipindah lewat PATCH.",
            operationId: "updatePengurusSubOrganisasi",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/UpdatePengurusSubOrganisasiInput" },
                    },
                },
            },
            responses: {
                "200": {
                    description: "Pengurus berhasil diperbarui.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PengurusSubOrganisasiSuccess" },
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
                    description: "Pengurus tidak ditemukan atau sub organisasi induknya bukan milik tenant.",
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
            tags: ["Pengurus Sub Organisasi"],
            summary: "Berhentikan pengurus sub organisasi",
            description:
                "Menghapus baris pengurus secara permanen. Unique (sub_organisasi_id, user_id) akan menolak pengangkatan ulang bila baris hanya dinonaktifkan; gunakan PATCH `isActive: false` untuk pemberhentian sementara yang tetap menyimpan riwayat.",
            operationId: "deletePengurusSubOrganisasi",
            responses: {
                "200": {
                    description: "Pengurus berhasil dihapus.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PengurusSubOrganisasiSuccess" },
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
                    description: "Pengurus tidak ditemukan atau sub organisasi induknya bukan milik tenant.",
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

export default pengurusSubOrganisasiPaths
