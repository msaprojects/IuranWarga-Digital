const userPaths = {
    "/users/{kode}": {
        parameters: [
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
            tags: ["User"],
            summary: "Daftar user dalam organisasi",
            description: "Mengembalikan user yang terdaftar pada organisasi dengan kode tersebut.",
            operationId: "getUsersByOrganizationCode",
            responses: {
                "401": { $ref: "#/components/responses/Unauthorized" },
                "200": {
                    description:
                        "Daftar user berhasil diambil; data berupa array kosong jika organisasi tidak ditemukan.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UserListSuccess" },
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
                    description: "Kesalahan server.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
            },
        },
    },
    "/user/{id}/{kode}": {
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                description: "ID user berupa bilangan bulat positif.",
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
            tags: ["User"],
            summary: "Detail user berdasarkan organisasi",
            description:
                "Mencari user berdasarkan ID dan memastikan user terikat pada organisasi dengan kode yang diberikan.",
            operationId: "getUserByIdAndOrganizationCode",
            responses: {
                "401": { $ref: "#/components/responses/Unauthorized" },
                "200": {
                    description: "User ditemukan.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UserSuccess" },
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
                    description: "User tidak ditemukan atau organisasi tidak aktif.",
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
    "/user": {
        post: {
            tags: ["User"],
            security: [{ BearerAuth: [] }],
            summary: "Buat user",
            description:
                "Membuat user pada organisasi yang ditentukan. Password wajib dikirim pada request dan tidak dicantumkan pada skema data user yang dibaca.",
            operationId: "createUser",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/CreateUserInput" },
                    },
                },
            },
            responses: {
                "401": { $ref: "#/components/responses/Unauthorized" },
                "201": {
                    description: "User berhasil dibuat.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UserSuccess" },
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
                    description: "Username, email, atau nomor kontak sudah digunakan.",
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
    "/user/{id}": {
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                description: "ID user berupa bilangan bulat positif.",
                schema: { type: "integer", minimum: 1 },
                example: 1,
            },
        ],
        patch: {
            tags: ["User"],
            summary: "Perbarui user",
            description:
                "Memperbarui satu atau lebih field user. Body harus berisi setidaknya satu field.",
            operationId: "updateUser",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/UpdateUserInput" },
                    },
                },
            },
            responses: {
                "401": { $ref: "#/components/responses/Unauthorized" },
                "200": {
                    description: "User berhasil diperbarui.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UserSuccess" },
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
                    description: "User tidak ditemukan.",
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                    },
                },
                "409": {
                    description: "Username, email, atau nomor kontak sudah digunakan.",
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
    "/user/login": {
        post: {
            tags: ["User"],
            security: [],
            summary: "Login user",
            description:
                "Memverifikasi username dan password. Jika berhasil, mengembalikan JWT yang berlaku selama satu jam.",
            operationId: "loginUser",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/LoginUserInput" },
                        example: { username: "admin01", password: "password123" },
                    },
                },
            },
            responses: {
                "200": {
                    description: "Login berhasil.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LoginSuccess" },
                        },
                    },
                },
                "400": {
                    description: "Body login tidak valid.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ValidationError" },
                        },
                    },
                },
                "401": {
                    description: "Kredensial salah atau organisasi tidak aktif.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                        },
                    },
                },
                "500": {
                    description: "Kesalahan server.",
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

export default userPaths
