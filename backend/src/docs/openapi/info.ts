const apiInfo = {
    openapi: "3.1.0",
    info: {
        title: "Iuran Warga API",
        version: "1.0.0",
        description:
            "API untuk mengelola organisasi, user, peserta, dan QR Code. Semua endpoint operasional memerlukan JWT Bearer token. Pengecualian: pendaftaran organisasi melalui POST /organisasi dan login melalui POST /user/login. Token memverifikasi identitas, sementara pembatasan akses berdasarkan role belum diterapkan.",
    },
    servers: [{ url: "http://localhost:9990/api", description: "API Local Development" }],
    tags: [
        {
            name: "Organisasi",
            description: "Pembuatan, pembacaan, pembaruan, dan penonaktifan organisasi warga.",
        },
        { name: "User", description: "Pengelolaan user dan pencarian berdasarkan organisasi." },
        {
            name: "Peserta",
            description: "Pengelolaan peserta dan data rumah berdasarkan organisasi.",
        },
        {
            name: "Detail Peserta",
            description:
                "Pengelolaan anggota keluarga (detail peserta) yang terkait dengan satu peserta.",
        },
    ],
} as const

export default apiInfo
