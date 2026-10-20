const PERIODE_IURAN = ["HARIAN", "MINGGUAN", "BULANAN", "TAHUNAN"] as const

const jenisIuranSchemas = {
    CreateJenisIuranInput: {
        type: "object",
        additionalProperties: false,
        required: [
            "judul",
            "periode_iuran",
            "nominal",
            "tanggal_awal",
            "tanggal_akhir",
            "organisasi_id",
        ],
        properties: {
            judul: { type: "string", minLength: 3, maxLength: 45, example: "Iuran Kebersihan" },
            periode_iuran: { type: "string", enum: [...PERIODE_IURAN], example: "BULANAN" },
            nominal: {
                type: "number",
                example: 50000,
                description: "Nominal iuran. Disimpan sebagai Decimal di basis data.",
            },
            tanggal_awal: {
                type: "string",
                format: "date",
                description: "Tanggal mulai berlaku periode iuran.",
                example: "2026-01-01",
            },
            tanggal_akhir: {
                type: "string",
                format: "date",
                description: "Tanggal akhir berlaku periode iuran.",
                example: "2026-12-31",
            },
            organisasi_id: {
                type: "integer",
                minimum: 1,
                description: "ID organisasi induk tempat jenis iuran ini dibuat.",
                example: 1,
            },
            isActive: { type: "boolean", default: true },
        },
        example: {
            judul: "Iuran Kebersihan",
            periode_iuran: "BULANAN",
            nominal: 50000,
            tanggal_awal: "2026-01-01",
            tanggal_akhir: "2026-12-31",
            organisasi_id: 1,
        },
    },
    UpdateJenisIuranInput: {
        type: "object",
        additionalProperties: false,
        properties: {
            judul: { type: "string", minLength: 3, maxLength: 45 },
            periode_iuran: { type: "string", enum: [...PERIODE_IURAN] },
            nominal: { type: "number" },
            tanggal_awal: { type: "string", format: "date" },
            tanggal_akhir: { type: "string", format: "date" },
            organisasi_id: { type: "integer", minimum: 1 },
            isActive: { type: "boolean" },
        },
        example: { judul: "Iuran Keamanan", nominal: 75000 },
    },
    JenisIuran: {
        type: "object",
        properties: {
            id: { type: "integer", example: 1 },
            judul: { type: "string", example: "Iuran Kebersihan" },
            periode_iuran: { type: "string", enum: [...PERIODE_IURAN], example: "BULANAN" },
            nominal: { type: "string", example: "50000" },
            tanggal_awal: { type: "string", format: "date", example: "2026-01-01" },
            tanggal_akhir: { type: "string", format: "date", example: "2026-12-31" },
            isActive: { type: "boolean", example: true },
            organisasi_id: { type: "integer", example: 1 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },
    JenisIuranSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { $ref: "#/components/schemas/JenisIuran" },
        },
    },
    JenisIuranListSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { type: "array", items: { $ref: "#/components/schemas/JenisIuran" } },
        },
    },
} as const

export default jenisIuranSchemas
