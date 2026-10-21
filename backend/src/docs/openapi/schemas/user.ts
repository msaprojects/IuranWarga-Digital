import { ASSIGNABLE_USER_ROLES, USER_ROLES } from "../../../utils/constanta.ts"

const userSchemas = {
    CreateUserInput: {
        type: "object",
        additionalProperties: false,
        required: ["name", "username", "password", "role", "organisasi_id"],
        properties: {
            username: { type: "string", minLength: 6, maxLength: 12 },
            name: { type: "string", minLength: 3, maxLength: 45 },
            password: { type: "string", minLength: 8, maxLength: 12, writeOnly: true },
            // Hanya role yang boleh ditetapkan via API (SUPER_ADMIN reserved).
            role: { type: "string", enum: [...ASSIGNABLE_USER_ROLES] },
            organisasi_id: { type: "integer", minimum: 1 },
            isActive: { type: "boolean", default: true },
            email: { type: ["string", "null"], format: "email", default: null },
            contact: { type: ["string", "null"], default: null },
        },
    },
    UpdateUserInput: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,
        properties: {
            username: { type: "string", minLength: 6, maxLength: 12 },
            name: { type: "string", minLength: 3, maxLength: 45 },
            password: { type: "string", minLength: 8, maxLength: 12, writeOnly: true },
            role: { type: "string", enum: [...ASSIGNABLE_USER_ROLES] },
            organisasi_id: { type: "integer", minimum: 1 },
            isActive: { type: "boolean" },
            // PATCH: omit = pertahankan nilai lama; null eksplisit = kosongkan.
            email: { type: ["string", "null"], format: "email" },
            contact: { type: ["string", "null"] },
        },
    },
    LoginUserInput: {
        type: "object",
        additionalProperties: false,
        required: ["username", "password"],
        properties: {
            username: { type: "string", minLength: 6, maxLength: 12 },
            password: {
                type: "string",
                minLength: 8,
                maxLength: 12,
                writeOnly: true,
            },
        },
        example: { username: "admin01", password: "password123" },
    },
    User: {
        type: "object",
        properties: {
            id: { type: "integer", example: 1 },
            username: { type: "string", example: "johndoe" },
            name: { type: ["string", "null"], example: "John Doe" },
            role: { type: "string", enum: [...USER_ROLES] },
            organisasi_id: { type: ["integer", "null"], example: 1 },
            email: { type: ["string", "null"], format: "email" },
            contact: { type: ["string", "null"] },
            latestLogin: { type: ["string", "null"], format: "date-time" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },
    UserSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { $ref: "#/components/schemas/User" },
        },
    },
    UserListSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { type: "array", items: { $ref: "#/components/schemas/User" } },
        },
    },
    LoginSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string", example: "Login berhasil" },
            data: {
                type: "object",
                required: ["user", "token"],
                properties: {
                    user: {
                        type: "object",
                        required: ["id", "username", "role", "kode_organisasi"],
                        properties: {
                            id: { type: "integer" },
                            username: { type: "string" },
                            name: { type: ["string", "null"] },
                            role: { type: "string", enum: [...USER_ROLES] },
                            kode_organisasi: { type: "string" },
                        },
                    },
                    token: {
                        type: "string",
                        description: "JWT Bearer token, berlaku satu jam.",
                    },
                },
            },
        },
    },
} as const

export default userSchemas
