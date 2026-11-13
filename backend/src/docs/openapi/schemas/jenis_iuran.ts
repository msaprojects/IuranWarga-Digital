import { JENIS_PESERTA, PERIODE_IURAN } from "../../../utils/constanta.ts"

const jenisIuranSchemas = {
    CreateJenisIuranInput: {
        type: "object",
        additionalProperties: false,
        required: ["judul", "periode_iuran", "jenis_peserta", "nominal", "organisasi_id"],
        properties: {
            judul: { type: "string", minLength: 3, maxLength: 45, example: "Iuran Kebersihan" },
            periode_iuran: { type: "string", enum: [...PERIODE_IURAN], example: "BULANAN" },
            jenis_peserta: {
                type: "string",
                enum: [...JENIS_PESERTA],
                description: "Tipe peserta yang dikenai tarif ini.",
                example: "RUMAH",
            },
            nominal: {
                type: "string",
                pattern: "^\\d+(\\.\\d{1,2})?$",
                example: "50000",
                description: "Nominal iuran dalam bentuk string (kolom Decimal di basis data).",
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
            jenis_peserta: "RUMAH",
            nominal: "50000",
            organisasi_id: 1,
        },
    },
    UpdateJenisIuranInput: {
        type: "object",
        additionalProperties: false,
        properties: {
            judul: { type: "string", minLength: 3, maxLength: 45 },
            periode_iuran: { type: "string", enum: [...PERIODE_IURAN] },
            jenis_peserta: { type: "string", enum: [...JENIS_PESERTA] },
            nominal: { type: "string", pattern: "^\\d+(\\.\\d{1,2})?$" },
            organisasi_id: { type: "integer", minimum: 1 },
            isActive: { type: "boolean" },
        },
        example: { judul: "Iuran Keamanan", nominal: "75000" },
    },
    JenisIuran: {
        type: "object",
        properties: {
            id: { type: "integer", example: 1 },
            judul: { type: "string", example: "Iuran Kebersihan" },
            periode_iuran: { type: "string", enum: [...PERIODE_IURAN], example: "BULANAN" },
            jenis_peserta: { type: "string", enum: [...JENIS_PESERTA], example: "RUMAH" },
            nominal: { type: "string", example: "50000" },
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
