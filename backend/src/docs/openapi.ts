import apiInfo from "./openapi/info.ts"
import organisasiPaths from "./openapi/organisasi.ts"
import organisasiSchemas from "./openapi/schemas/organisasi.ts"
import userSchemas from "./openapi/schemas/user.ts"
import pesertaPaths from "./openapi/peserta.ts"
import pesertaSchemas from "./openapi/schemas/peserta.ts"
import userPaths from "./openapi/user.ts"
import commonSchemas from "./openapi/schemas/common.ts"

const openApiSpec = {
    ...apiInfo,
    paths: { ...organisasiPaths, ...userPaths, ...pesertaPaths },
    security: [{ BearerAuth: [] }],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description:
                    "Kirim access token hasil login sebagai `Authorization: Bearer <token>`.",
            },
        },
        responses: {
            Unauthorized: {
                description: "Bearer token tidak ada, kedaluwarsa, atau tidak valid.",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/AuthenticationError" },
                        examples: {
                            missing: { value: { message: "Unauthorized" } },
                            expired: { value: { message: "Token expired" } },
                            invalid: { value: { message: "Invalid token" } },
                        },
                    },
                },
            },
        },
        schemas: {
            ...commonSchemas,
            ...organisasiSchemas,
            ...userSchemas,
            ...pesertaSchemas,
        },
    },
} as const

export default openApiSpec
