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
                "500": {
                    description:
                        "Kesalahan server, termasuk jika organisasi tidak ditemukan atau tidak aktif.",
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
                    description:
                        "Kesalahan server, termasuk jika organisasi tidak ditemukan atau tidak aktif.",
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
                "500": {
                    description:
                        "Kesalahan server, termasuk jika kode peserta yang diberikan sudah digunakan.",
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
            tags: ["QR Code"],
            summary: "Dekripsi QR Code peserta",
            description: "Memvalidasi QR Code dan mengembalikan data peserta yang terkait.",
            operationId: "decryptPesertaQRCode",
            responses: {
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
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "500": {
                    description:
                        "QR Code tidak dapat didekripsi atau data organisasi/peserta tidak ditemukan.",
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
            tags: ["QR Code"],
            summary: "Cabut QR Code peserta",
            description:
                "Mengosongkan token QR peserta. Endpoint ini menggunakan GET sesuai route yang tersedia.",
            operationId: "revokePesertaQRCode",
            responses: {
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
                "500": {
                    description: "Kesalahan server.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
            },
        },
    },
    "/peserta/qr/generate/{id}/{kode}": {
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
            tags: ["QR Code"],
            summary: "Buat QR Code peserta",
            description:
                "Menghasilkan string QR Code terenkripsi untuk ID peserta dan organisasi yang diberikan.",
            operationId: "generatePesertaQRCode",
            responses: {
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
                "500": {
                    description: "Kesalahan server.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
            },
        },
    },
} as const;

export default pesertaPaths;
