const apiInfo = {
    openapi: "3.1.0",
    info: {
        title: "Iuran Warga API",
        version: "1.0.0",
        description:
            "API untuk mengelola organisasi, user, peserta, dan QR Code. Semua endpoint menggunakan JSON. Saat ini endpoint belum dilindungi autentikasi maupun otorisasi; batasi akses API pada lingkungan tepercaya.",
    },
    servers: [{ url: "/api", description: "API server" }],
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
        { name: "QR Code", description: "Pembuatan, pencabutan, dan dekripsi QR Code peserta." },
    ],
} as const;

export default apiInfo;
