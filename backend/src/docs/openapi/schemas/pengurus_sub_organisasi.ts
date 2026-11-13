const pengurusSubOrganisasiSchemas = {
    CreatePengurusSubOrganisasiInput: {
        type: "object",
        additionalProperties: false,
        required: ["user_id", "jabatan"],
        properties: {
            user_id: {
                type: "integer",
                minimum: 1,
                description: "User aktif yang terikat ke organisasi yang sama dengan token.",
            },
            jabatan: {
                type: "string",
                minLength: 3,
                maxLength: 64,
                description: "Jabatan dalam sub organisasi, mis. KETUA / SEKRETARIS / BENDAHARA.",
            },
            isActive: { type: "boolean", default: true },
        },
        example: { user_id: 3, jabatan: "KETUA" },
    },
    UpdatePengurusSubOrganisasiInput: {
        type: "object",
        additionalProperties: false,
        properties: {
            jabatan: { type: "string", minLength: 3, maxLength: 64 },
            isActive: { type: "boolean" },
        },
        example: { jabatan: "BENDAHARA" },
    },
    PengurusSubOrganisasi: {
        type: "object",
        properties: {
            id: { type: "integer", example: 1 },
            sub_organisasi_id: { type: "integer", example: 1 },
            user_id: { type: "integer", example: 3 },
            jabatan: { type: "string", example: "KETUA" },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },
    PengurusSubOrganisasiSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { $ref: "#/components/schemas/PengurusSubOrganisasi" },
        },
    },
    PengurusSubOrganisasiListSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { type: "array", items: { $ref: "#/components/schemas/PengurusSubOrganisasi" } },
        },
    },
} as const

export default pengurusSubOrganisasiSchemas
