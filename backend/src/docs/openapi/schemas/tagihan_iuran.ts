import { STATUS_TAGIHAN } from "../../../utils/constanta.ts"

// Nominal tagihan / terbayar adalah kolom Decimal di basis data, jadi direpresentasikan
// sebagai string di kontrak API untuk menghindari kehilangan presisi floating-point.
const tagihanIuranSchemas = {
    CreateTagihanIuranInput: {
        type: "object",
        additionalProperties: false,
        required: ["organisasi_id", "jenis_iuran_id", "tahun", "bulan", "nominal_tagihan"],
        properties: {
            organisasi_id: {
                type: "integer",
                minimum: 1,
                description:
                    "ID organisasi aktif. Tagihan dibuat untuk SELURUH peserta aktif pada organisasi ini.",
                example: 1,
            },
            jenis_iuran_id: {
                type: "integer",
                minimum: 1,
                description: "ID jenis iuran aktif yang ditagihkan.",
                example: 1,
            },
            tahun: {
                type: "integer",
                minimum: 2000,
                maximum: 2999,
                description: "Tahun periode tagihan.",
                example: 2026,
            },
            bulan: {
                type: "integer",
                minimum: 1,
                maximum: 12,
                description: "Bulan periode tagihan (1-12).",
                example: 10,
            },
            nominal_tagihan: {
                type: "string",
                pattern: "^\\d+(\\.\\d{1,2})?$",
                example: "50000",
                description: "Nominal yang wajib dibayar (string Decimal, maksimal 2 desimal).",
            },
        },
        example: {
            organisasi_id: 1,
            jenis_iuran_id: 1,
            tahun: 2026,
            bulan: 10,
            nominal_tagihan: "50000",
        },
    },
    UpdateTagihanIuranInput: {
        type: "object",
        additionalProperties: false,
        required: ["jenis_iuran_id", "tahun", "bulan", "nominal_tagihan"],
        properties: {
            jenis_iuran_id: { type: "integer", minimum: 1 },
            tahun: { type: "integer", minimum: 2000, maximum: 2999 },
            bulan: { type: "integer", minimum: 1, maximum: 12 },
            nominal_tagihan: { type: "string", pattern: "^\\d+(\\.\\d{1,2})?$" },
        },
        example: {
            jenis_iuran_id: 1,
            tahun: 2026,
            bulan: 11,
            nominal_tagihan: "60000",
        },
    },
    DeleteTagihanIuranInput: {
        type: "object",
        additionalProperties: false,
        required: ["deleted_reason"],
        properties: {
            deleted_reason: {
                type: "string",
                minLength: 3,
                maxLength: 255,
                description: "Alasan penghapusan tagihan, tersimpan sebagai deletedDescription.",
                example: "Peserta pindah rumah",
            },
        },
        example: { deleted_reason: "Peserta pindah rumah" },
    },
    TagihanIuran: {
        type: "object",
        properties: {
            id: { type: "integer", example: 1 },
            nomor_tagihan: { type: "string", example: "TAG-202610-1AB12F" },
            organisasi_id: { type: "integer", example: 1 },
            jenis_iuran_id: { type: "integer", example: 1 },
            peserta_id: { type: "integer", example: 1 },
            tahun: { type: "integer", example: 2026 },
            bulan: { type: "integer", nullable: true, example: 10 },
            tanggal_terbit: { type: "string", format: "date", example: "2026-10-31" },
            nominal_tagihan: { type: "string", example: "50000" },
            status: { type: "string", enum: [...STATUS_TAGIHAN], example: "BELUM_BAYAR" },
            keterangan: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },
    TagihanIuranSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { $ref: "#/components/schemas/TagihanIuran" },
        },
    },
    TagihanIuranListSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { type: "array", items: { $ref: "#/components/schemas/TagihanIuran" } },
        },
    },
} as const

export default tagihanIuranSchemas
