export const enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN",
    SUPERADMIN = "SUPERADMIN",
}

export const enum PeriodeIuran {
    HARIAN = "HARIAN",
    MINGGUAN = "MINGGUAN",
    BULANAN = "BULANAN",
    TAHUNAN = "TAHUNAN",
}

export const enum StatusTagihan {
    BELUM_BAYAR = "BELUM_BAYAR",
    PARTIAL = "PARTIAL",
    SUDAH_BAYAR = "SUDAH_BAYAR",
    OVERDUE = "OVERDUE",
    CANCELLED = "CANCELLED",
}

export const enum StatusPembayaran {
    BERHASIL = "BERHASIL",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED",
}

export const enum StatusKeluarga {
    KEPALA_KELUARGA = "KEPALA_KELUARGA",
    SUAMI = "SUAMI",
    ISTRI = "ISTRI",
    ANAK = "ANAK",
    ORANG_TUA = "ORANG_TUA",
    LAINNYA = "LAINNYA",
}

export const enum JenisKeuangan {
    PEMASUKAN = "PEMASUKAN",
    PENGELUARAN = "PENGELUARAN",
}
