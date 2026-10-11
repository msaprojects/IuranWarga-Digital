const schemas = {
    CreateOrganisasiInput: {
        type: "object",
        additionalProperties: false,
        required: ["kode", "nama"],
        properties: {
            kode: { type: "string", minLength: 6, maxLength: 64 },
            nama: { type: "string", minLength: 1, maxLength: 120 },
            alamat: { type: ["string", "null"], maxLength: 500, default: null },
            website: { type: ["string", "null"], maxLength: 2048, default: null },
            isActive: { type: "boolean", default: true },
            activeAt: {
                type: ["string", "null"],
                format: "date-time",
                default: null,
            },
        },
    },
    UpdateOrganisasiInput: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,
        properties: {
            kode: { type: "string", minLength: 6, maxLength: 64 },
            nama: { type: "string", minLength: 1, maxLength: 120 },
            alamat: { type: ["string", "null"], maxLength: 500 },
            website: { type: ["string", "null"], maxLength: 2048 },
            activeAt: { type: ["string", "null"], format: "date-time" },
        },
    },
    Organisasi: {
        type: "object",
        properties: {
            id: { type: "integer", example: 1 },
            kode: { type: "string", example: "ORG001" },
            nama: { type: "string", example: "Warga Harmoni" },
            alamat: { type: ["string", "null"] },
            website: { type: ["string", "null"] },
            isActive: { type: "boolean" },
            activeAt: { type: ["string", "null"], format: "date-time" },
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
            data: { $ref: "#/components/schemas/Organisasi" },
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

export default schemas;
