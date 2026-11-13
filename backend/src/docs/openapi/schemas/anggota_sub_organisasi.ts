const anggotaSubOrganisasiSchemas = {
    CreateAnggotaSubOrganisasiInput: {
        type: "object",
        additionalProperties: false,
        required: ["peserta_id"],
        properties: {
            peserta_id: {
                type: "integer",
                minimum: 1,
                description: "Peserta aktif yang berada di organisasi yang sama dengan token.",
            },
            isActive: { type: "boolean", default: true },
        },
        example: { peserta_id: 10 },
    },
    UpdateAnggotaSubOrganisasiInput: {
        type: "object",
        additionalProperties: false,
        required: ["isActive"],
        properties: {
            isActive: {
                type: "boolean",
                description:
                    "Status keanggotaan. Pasangan sub_organisasi_id + peserta_id tidak dapat diubah.",
            },
        },
        example: { isActive: false },
    },
    AnggotaSubOrganisasi: {
        type: "object",
        properties: {
            id: { type: "integer", example: 1 },
            sub_organisasi_id: { type: "integer", example: 1 },
            peserta_id: { type: "integer", example: 10 },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },
    AnggotaSubOrganisasiSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { $ref: "#/components/schemas/AnggotaSubOrganisasi" },
        },
    },
    AnggotaSubOrganisasiListSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { type: "array", items: { $ref: "#/components/schemas/AnggotaSubOrganisasi" } },
        },
    },
} as const

export default anggotaSubOrganisasiSchemas
