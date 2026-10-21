export const enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN",
    SUPERADMIN = "SUPERADMIN",
}

// Periode iuran: satu sumber kebenaran untuk service, validator, dan docs.
// Dipakai sebagai `z.enum(PERIODE_IURAN)` dan sebagai tipe `PeriodeIuran`.
export const PERIODE_IURAN = ["HARIAN", "MINGGUAN", "BULANAN", "TAHUNAN"] as const
export type PeriodeIuran = (typeof PERIODE_IURAN)[number]

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

// Status keluarga: satu sumber kebenaran untuk service, validator, dan docs.
// Dipakai sebagai `z.enum(STATUS_KELUARGA)` dan sebagai tipe `StatusKeluarga`.
export const STATUS_KELUARGA = [
    "KEPALA_KELUARGA",
    "SUAMI",
    "ISTRI",
    "ANAK",
    "ORANG_TUA",
    "LAINNYA",
] as const
export type StatusKeluarga = (typeof STATUS_KELUARGA)[number]

export const enum JenisKeuangan {
    PEMASUKAN = "PEMASUKAN",
    PENGELUARAN = "PENGELUARAN",
}
