const pesertaSchemas = {
    CreatePesertaInput: {
        type: "object",
        additionalProperties: false,
        required: ["nama", "organisasi_id", "user_id"],
        properties: {
            kode: {
                type: "string",
                minLength: 6,
                maxLength: 8,
                description: "Opsional; akan dibuat otomatis bila tidak dikirim.",
            },
            nama: { type: "string", minLength: 3, maxLength: 45 },
            nomor_rumah: { type: "string", minLength: 1, maxLength: 20 },
            alamat: { type: "string", minLength: 3, maxLength: 128 },
            deskripsi: { type: "string", minLength: 3, maxLength: 256 },
            qr_token: { type: "string", minLength: 3, maxLength: 256 },
            isActive: { type: "boolean", default: true },
            organisasi_id: { type: "integer", minimum: 1 },
            user_id: { type: "integer", minimum: 1 },
        },
        example: {
            nama: "Budi Santoso",
            nomor_rumah: "A-01",
            alamat: "Jl. Melati No. 10",
            organisasi_id: 1,
            user_id: 2,
        },
    },
    UpdatePesertaInput: {
        type: "object",
        additionalProperties: false,
        required: ["nama", "user_id"],
        properties: {
            kode: { type: "string", minLength: 6, maxLength: 8 },
            nama: { type: "string", minLength: 3, maxLength: 45 },
            nomor_rumah: { type: "string", minLength: 1, maxLength: 20 },
            alamat: { type: "string", minLength: 3, maxLength: 128 },
            deskripsi: { type: "string", minLength: 3, maxLength: 256 },
            qr_token: { type: "string", minLength: 3, maxLength: 256 },
            isActive: { type: "boolean", default: true },
            user_id: { type: "integer", minimum: 1 },
        },
        example: { nama: "Budi Santoso", user_id: 2 },
    },
    Peserta: {
        type: "object",
        properties: {
            id: { type: "integer", example: 1 },
            kode: { type: "string", example: "PST001" },
            nama: { type: ["string", "null"], example: "Budi Santoso" },
            nomor_rumah: { type: ["string", "null"], example: "A-01" },
            alamat: { type: ["string", "null"] },
            deskripsi: { type: ["string", "null"] },
            qr_token: {
                type: ["string", "null"],
                description: "Token QR peserta; dapat bernilai null setelah dicabut.",
            },
            isActive: { type: "boolean" },
            organisasi_id: { type: "integer" },
            user_id: { type: ["integer", "null"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },
    PesertaSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { $ref: "#/components/schemas/Peserta" },
        },
    },
    PesertaListSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { type: "array", items: { $ref: "#/components/schemas/Peserta" } },
        },
    },
    QrCodeSuccess: {
        type: "object",
        required: ["status", "message", "data"],
        properties: {
            status: { type: "string", const: "success" },
            message: { type: "string" },
            data: { type: "string", description: "String QR Code terenkripsi." },
        },
    },
} as const;

export default pesertaSchemas;
