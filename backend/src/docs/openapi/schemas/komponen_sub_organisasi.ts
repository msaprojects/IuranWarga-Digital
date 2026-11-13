const komponenSubOrganisasiSchemas = {
    CreateKomponenSubOrganisasiInput: {
        type: "object",
        additionalProperties: false,
        required: ["jenis_iuran_id", "nominal"],
        properties: {
            jenis_iuran_id: {
                type: "integer",
                minimum: 1,
                description: "Jenis iuran aktif milik organisasi yang sama dengan token.",
            },
            nominal: {
                type: "string",
                pattern: "^\\d+(\\.\\d{1,2})?$",
                description:
                    "Override tarif sub organisasi (string desimal, maksimal 2 desimal, > 0). Simpan hanya bila berbeda dari tarif induk.",
                example: "75000",
            },
            isActive: { type: "boolean", default: true },
        },
        example: { jenis_iuran_id: 2, nominal: "75000" },
    },
    UpdateKomponenSubOrganisasiInput: {
        type: "object",
        additionalProperties: false,
        properties: {
            nominal: { type: "string", pattern: "^\\d+(\\.\\d{1,2})?$" },
            isActive: { type: "boolean" },
        },
        example: { nominal: "80000" },
    },
    KomponenSubOrganisasi: {
        type: "object",
        properties: {
            id: { type: "integer", example: 1 },
            sub_organisasi_id: { type: "integer", example: 1 },
            jenis_iuran_id: { type: "integer", example: 2 },
            nominal: { type: "string", example: "75000" },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },
    KomponenSubOrganisasiSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { $ref: "#/components/schemas/KomponenSubOrganisasi" },
        },
    },
    KomponenSubOrganisasiListSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { type: "array", items: { $ref: "#/components/schemas/KomponenSubOrganisasi" } },
        },
    },
} as const

export default komponenSubOrganisasiSchemas
