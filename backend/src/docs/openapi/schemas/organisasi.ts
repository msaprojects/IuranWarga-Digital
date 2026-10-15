const organisasiSchemas = {
    CreateOrganisasiWithUserInput: {
        type: "object",
        additionalProperties: false,
        required: ["organisasi", "user"],
        properties: {
            organisasi: { $ref: "#/components/schemas/CreateOrganisasiInput" },
            user: { $ref: "#/components/schemas/CreateOrganisasiAdminInput" },
        },
        example: {
            organisasi: {
                kode: "ORG001",
                nama: "Warga01",
                alamat: "Jl. Melati No. 10",
                website: "https://wargaharmoni.example",
                email: "wargaharmoni@example.com",
                contact: "+6281234567890",
            },
            user: {
                username: "admin01",
                name: "Admin Organisasi",
                password: "password1",
                email: "admin01@example.com",
                contact: "+6281234567890",
            },
        },
    },
    CreateOrganisasiAdminInput: {
        type: "object",
        additionalProperties: false,
        required: ["username", "name", "password"],
        properties: {
            username: { type: "string", minLength: 6, maxLength: 12 },
            name: { type: "string", minLength: 3, maxLength: 45 },
            password: {
                type: "string",
                minLength: 8,
                maxLength: 12,
                writeOnly: true,
            },
            email: { type: ["string", "null"], format: "email", default: null },
            contact: { type: ["string", "null"], maxLength: 20, default: null },
        },
    },
    CreateOrganisasiInput: {
        type: "object",
        additionalProperties: false,
        required: ["kode", "nama"],
        properties: {
            kode: { type: "string", minLength: 6, maxLength: 8 },
            nama: { type: "string", minLength: 6, maxLength: 8 },
            alamat: { type: ["string", "null"], maxLength: 500, default: null },
            website: { type: ["string", "null"], maxLength: 2048, default: null },
            isActive: { type: "boolean", default: true },
            activeAt: {
                type: ["string", "null"],
                format: "date-time",
                default: null,
            },
            email: { type: ["string", "null"], format: "email", default: null },
            contact: { type: ["string", "null"], maxLength: 20, default: null },
        },
    },
    UpdateOrganisasiInput: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,
        properties: {
            kode: { type: "string", minLength: 6, maxLength: 8 },
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

export default organisasiSchemas;
