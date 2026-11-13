const subOrganisasiSchemas = {
    CreateSubOrganisasiInput: {
        type: "object",
        additionalProperties: false,
        required: ["nama"],
        properties: {
            nama: {
                type: "string",
                minLength: 3,
                maxLength: 128,
                description:
                    "Nama sub organisasi. Unik di dalam satu organisasi (termasuk yang nonaktif).",
            },
            deskripsi: { type: ["string", "null"], maxLength: 255 },
            pisah_laporan: {
                type: "boolean",
                default: false,
                description:
                    "true = laporan keuangan sub organisasi dipisah dari organisasi induk.",
            },
            isActive: { type: "boolean", default: true },
        },
        example: { nama: "PKK", deskripsi: "Pemberdayaan Kesejahteraan Keluarga", pisah_laporan: true },
    },
    UpdateSubOrganisasiInput: {
        type: "object",
        additionalProperties: false,
        properties: {
            nama: { type: "string", minLength: 3, maxLength: 128 },
            deskripsi: {
                type: ["string", "null"],
                maxLength: 255,
                description: "Kirim null untuk mengosongkan deskripsi.",
            },
            pisah_laporan: { type: "boolean" },
            isActive: {
                type: "boolean",
                description: "Kirim true untuk mengaktifkan kembali sub organisasi yang nonaktif.",
            },
        },
        example: { nama: "PKK RW 05", pisah_laporan: false },
    },
    SubOrganisasi: {
        type: "object",
        properties: {
            id: { type: "integer", example: 1 },
            organisasi_id: { type: "integer", example: 1 },
            nama: { type: "string", example: "PKK" },
            deskripsi: { type: ["string", "null"], example: "Pemberdayaan Kesejahteraan Keluarga" },
            pisah_laporan: { type: "boolean", example: true },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },
    SubOrganisasiSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { $ref: "#/components/schemas/SubOrganisasi" },
        },
    },
    SubOrganisasiListSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { type: "array", items: { $ref: "#/components/schemas/SubOrganisasi" } },
        },
    },
} as const

export default subOrganisasiSchemas
