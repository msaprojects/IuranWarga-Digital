const apiInfo = {
    openapi: "3.1.0",
    info: {
        title: "Iuran Warga API",
        version: "1.0.0",
        description:
            "API untuk mengelola data organisasi. Create, update, dan delete belum dilindungi autentikasi; gunakan hanya di lingkungan development sampai akses dikunci.",
    },
    servers: [{ url: "/api", description: "API server" }],
    tags: [{ name: "Organisasi", description: "Data organisasi warga" }],
} as const;

export default apiInfo;
