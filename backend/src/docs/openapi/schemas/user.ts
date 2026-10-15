const userSchemas = {
    CreateUserInput: {
        type: "object",
        additionalProperties: false,
        required: ["name", "username", "password", "role", "organisasi_id"],
        properties: {
            username: { type: "string", minLength: 6, maxLength: 12 },
            name: { type: "string", minLength: 3, maxLength: 45 },
            password: { type: "string", minLength: 8, maxLength: 12 },
            role: { type: "string", enum: ["ADMIN", "USER"] },
            organisasi_id: { type: "integer" },
            email: { type: ["string", "null"], format: "email", default: null },
            contact: { type: ["string", "null"], maxLength: 20, default: null },
        },
    },
    UpdateUserInput: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,
        properties: {
            username: { type: "string", minLength: 6, maxLength: 12 },
            name: { type: "string", minLength: 3, maxLength: 45 },
            password: { type: "string", minLength: 8, maxLength: 12 },
            role: { type: "string", enum: ["ADMIN", "USER"] },
            email: { type: ["string", "null"], format: "email" },
            contact: { type: ["string", "null"], maxLength: 20 },
        },
    },
    User: {
        type: "object",
        properties: {
            id: { type: "integer", example: 1 },
            username: { type: "string", example: "johndoe" },
            name: { type: "string", example: "John Doe" },
            role: { type: "string", enum: ["ADMIN", "USER"] },
            organisasi_id: { type: "integer", example: 1 },
            email: { type: ["string", "null"], format: "email" },
            contact: { type: ["string", "null"], maxLength: 20 },
            latestLogin: { type: ["string", "null"], format: "date-time" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },
    OrganisasiSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { $ref: "#/components/schemas/User" },
        },
    },
    Error: {
        type: "object",
        required: ["status", "message"],
        properties: {
            status: { type: "string", const: "failed" },
            message: { type: "string" },
        },
    },
    ValidationError: {
        type: "object",
        required: ["status", "message", "errors"],
        properties: {
            status: { type: "string", const: "failed" },
            message: { type: "string", example: "Validation Error" },
            errors: {
                type: "array",
                items: {
                    type: "object",
                    required: ["field", "message"],
                    properties: {
                        field: { type: "string" },
                        message: { type: "string" },
                    },
                },
            },
        },
    },
} as const;

export default userSchemas;
