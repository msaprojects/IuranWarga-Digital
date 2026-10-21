import { STATUS_KELUARGA } from "../../../utils/constanta.ts"

const detailPesertaSchemas = {
    CreateDetailPesertaInput: {
        type: "object",
        additionalProperties: false,
        required: ["nama", "status_keluarga", "peserta_id"],
        properties: {
            nama: { type: "string", minLength: 3, maxLength: 128 },
            status_keluarga: { type: "string", enum: [...STATUS_KELUARGA] },
            peserta_id: {
                type: "integer",
                minimum: 1,
                description: "ID peserta induk tempat detail/anggota keluarga ini terdaftar.",
            },
            isActive: { type: "boolean", default: true },
        },
        example: {
            nama: "Andi Santoso",
            status_keluarga: "ANAK",
            peserta_id: 10,
        },
    },
    UpdateDetailPesertaInput: {
        type: "object",
        additionalProperties: false,
        properties: {
            nama: { type: "string", minLength: 3, maxLength: 128 },
            status_keluarga: { type: "string", enum: [...STATUS_KELUARGA] },
            peserta_id: {
                type: "integer",
                minimum: 1,
                description:
                    "Pindahkan anggota keluarga ke peserta lain. Nilai harus merujuk peserta aktif.",
            },
            isActive: { type: "boolean" },
        },
        example: { nama: "Andi Santoso Baru", status_keluarga: "KEPALA_KELUARGA" },
    },
    DetailPeserta: {
        type: "object",
        properties: {
            id: { type: "integer", example: 1 },
            peserta_id: { type: "integer", example: 10 },
            nama: { type: "string", example: "Andi Santoso" },
            status_keluarga: { type: "string", enum: [...STATUS_KELUARGA], example: "ANAK" },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },
    DetailPesertaSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { $ref: "#/components/schemas/DetailPeserta" },
        },
    },
    DetailPesertaListSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { type: "array", items: { $ref: "#/components/schemas/DetailPeserta" } },
        },
    },
} as const

export default detailPesertaSchemas
