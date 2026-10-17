const pesertaPaths = {
    "/peserta/{identifier}": {
        get: {
            tags: ["Peserta"],
            summary: "Daftar peserta dalam organisasi",
            operationId: "getPesertaByOrganizationCode",
            parameters: [
                {
                    name: "identifier",
                    in: "path",
                    required: true,
                    description: "Kode organisasi, 6-8 karakter.",
                    schema: { type: "string", minLength: 6, maxLength: 8 },
                    example: "ORG001",
                },
            ],
            responses: {
                "401": { $ref: "#/components/responses/Unauthorized" },
                "200": {
                    description: "Daftar peserta berhasil diambil.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PesertaListSuccess" },
                        },
                    },
                },
                "400": {
                    description: "Kode organisasi tidak valid.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "404": {
                    description: "Organisasi tidak ditemukan atau tidak aktif.",
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
            tags: ["Peserta"],
            summary: "Perbarui peserta",
            description:
                "Memperbarui data peserta. Sesuai validasi endpoint, body wajib menyertakan nama dan user_id.",
            operationId: "updatePeserta",
            parameters: [
                {
                    name: "identifier",
                    in: "path",
                    required: true,
                    description: "ID peserta berupa bilangan bulat positif.",
                    schema: { type: "integer", minimum: 1 },
                    example: 1,
                },
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/UpdatePesertaInput" },
                    },
                },
            },
            responses: {
                "401": { $ref: "#/components/responses/Unauthorized" },
                "200": {
                    description: "Peserta berhasil diperbarui.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PesertaSuccess" },
                        },
                    },
                },
                "400": {
                    description: "ID atau body tidak valid.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "404": {
                    description: "Peserta tidak ditemukan.",
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
    "/peserta/{id}/{kode}": {
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                description: "ID peserta berupa bilangan bulat positif.",
                schema: { type: "integer", minimum: 1 },
                example: 1,
            },
            {
                name: "kode",
                in: "path",
                required: true,
                description: "Kode organisasi, 6-8 karakter.",
                schema: { type: "string", minLength: 6, maxLength: 8 },
                example: "ORG001",
            },
        ],
        get: {
            tags: ["Peserta"],
            summary: "Detail peserta berdasarkan organisasi",
            description: "Mencari peserta berdasarkan ID dan kode organisasi.",
            operationId: "getPesertaByIdAndOrganizationCode",
            responses: {
                "401": { $ref: "#/components/responses/Unauthorized" },
                "200": {
                    description: "Peserta ditemukan.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PesertaSuccess" },
                        },
                    },
                },
                "400": {
                    description: "ID atau kode organisasi tidak valid.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "404": {
                    description: "Peserta tidak ditemukan pada organisasi aktif tersebut.",
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
    "/peserta": {
        post: {
            tags: ["Peserta"],
            security: [{ BearerAuth: [] }],
            summary: "Buat peserta",
            description: "Membuat peserta. Kode peserta dibuat otomatis jika tidak disertakan.",
            operationId: "createPeserta",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/CreatePesertaInput" },
                    },
                },
            },
            responses: {
                "401": { $ref: "#/components/responses/Unauthorized" },
                "201": {
                    description: "Peserta berhasil dibuat.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PesertaSuccess" },
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
                    description: "Organisasi tidak ditemukan atau tidak aktif.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
                "409": {
                    description:
                        "Kode peserta yang dikirim atau token QR sudah digunakan di organisasi tersebut.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
                "503": {
                    description: "Kode peserta otomatis tidak dapat dibuat saat ini.",
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
    "/peserta/qr/decrypt/{qrCodeString}": {
        parameters: [
            {
                name: "qrCodeString",
                in: "path",
                required: true,
                description: "String QR Code terenkripsi; URL-encode karakter khusus.",
                schema: { type: "string", minLength: 3, maxLength: 256 },
                example: "encrypted-qr-token",
            },
        ],
        get: {
            tags: ["Peserta"],
            summary: "Dekripsi QR Code peserta",
            description: "Memvalidasi QR Code dan mengembalikan data peserta yang terkait.",
            operationId: "decryptPesertaQRCode",
            responses: {
                "401": { $ref: "#/components/responses/Unauthorized" },
                "200": {
                    description: "QR Code berhasil didekripsi.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PesertaSuccess" },
                        },
                    },
                },
                "400": {
                    description: "String QR Code tidak valid.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                        },
                    },
                },
                "404": {
                    description: "Organisasi atau peserta QR tidak ditemukan atau tidak aktif.",
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
    "/peserta/qr/revoke/{id}/{kode}": {
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                description: "ID peserta berupa bilangan bulat positif.",
                schema: { type: "integer", minimum: 1 },
                example: 1,
            },
            {
                name: "kode",
                in: "path",
                required: true,
                description: "Kode organisasi, 6-8 karakter.",
                schema: { type: "string", minLength: 6, maxLength: 8 },
                example: "ORG001",
            },
        ],
        get: {
            tags: ["Peserta"],
            summary: "Cabut QR Code peserta",
            description:
                "Mengosongkan token QR peserta. Endpoint ini menggunakan GET sesuai route yang tersedia.",
            operationId: "revokePesertaQRCode",
            responses: {
                "401": { $ref: "#/components/responses/Unauthorized" },
                "200": {
                    description: "QR Code berhasil dicabut.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PesertaSuccess" },
                        },
                    },
                },
                "400": {
                    description: "ID atau kode organisasi tidak valid.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "404": {
                    description: "Peserta QR tidak ditemukan.",
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
    "/peserta/qr/generate/{kodePeserta}/{kodeOrganisasi}": {
        parameters: [
            {
                name: "kodePeserta",
                in: "path",
                required: true,
                description: "Kode peserta, 6-8 karakter.",
                schema: { type: "string", minLength: 6, maxLength: 8 },
                example: "PES001",
            },
            {
                name: "kodeOrganisasi",
                in: "path",
                required: true,
                description: "Kode organisasi, 6-8 karakter.",
                schema: { type: "string", minLength: 6, maxLength: 8 },
                example: "ORG001",
            },
        ],
        get: {
            tags: ["Peserta"],
            summary: "Buat QR Code peserta",
            description:
                "Menghasilkan string QR Code terenkripsi untuk ID peserta dan organisasi yang diberikan.",
            operationId: "generatePesertaQRCode",
            responses: {
                "401": { $ref: "#/components/responses/Unauthorized" },
                "200": {
                    description: "QR Code berhasil dibuat.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/QrCodeSuccess" },
                        },
                    },
                },
                "400": {
                    description: "ID atau kode organisasi tidak valid.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "404": {
                    description: "Peserta tidak ditemukan atau tidak aktif.",
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
    "/peserta/qr/download/{qrUrl}": {
        parameters: [
            {
                name: "qrUrl",
                in: "path",
                required: true,
                description: "URL QR Code yang ingin diunduh.",
                schema: { type: "string", format: "uri" },
                example: "https://example.com/qr/123",
            },
        ],
        get: {
            tags: ["Peserta"],
            summary: "Download QR Code peserta",
            description:
                "Menghasilkan file PNG QR Code dari URL QR Code yang diberikan. Endpoint ini menggunakan GET sesuai route yang tersedia.",
            operationId: "downloadPesertaQRCode",
            responses: {
                "401": { $ref: "#/components/responses/Unauthorized" },
                "200": {
                    description: "QR Code berhasil diunduh.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/QrCodeSuccess" },
                        },
                    },
                },
                "400": {
                    description: "Url QR Code tidak valid.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "404": {
                    description: "Url QR Code tidak ditemukan.",
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

export default pesertaPaths
