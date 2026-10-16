const userSchemas = {
    CreateUserInput: {
        type: "object",
        additionalProperties: false,
        required: ["name", "username", "password", "role", "organisasi_id"],
        properties: {
            username: { type: "string", minLength: 6, maxLength: 12 },
            name: { type: "string", minLength: 3, maxLength: 45 },
            password: { type: "string", minLength: 8, maxLength: 12, writeOnly: true },
            role: { type: "string", enum: ["ADMIN", "USER"] },
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
            role: { type: "string", enum: ["ADMIN", "USER"] },
            organisasi_id: { type: "integer", minimum: 1 },
            isActive: { type: "boolean" },
            email: { type: ["string", "null"], format: "email" },
            contact: { type: ["string", "null"] },
        },
    },
    User: {
        type: "object",
        properties: {
            id: { type: "integer", example: 1 },
            username: { type: "string", example: "johndoe" },
            name: { type: ["string", "null"], example: "John Doe" },
            role: { type: "string", enum: ["ADMIN", "USER"] },
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
} as const;

export default userSchemas;
