export const USER_ROLES = ["USER", "ADMIN", "SUPER_ADMIN"] as const

export const ASSIGNABLE_USER_ROLES = ["USER", "ADMIN"] as const

export const PERIODE_IURAN = ["HARIAN", "MINGGUAN", "BULANAN", "TAHUNAN"] as const

export const STATUS_TAGIHAN = ["BELUM_BAYAR", "PARTIAL", "SUDAH_BAYAR", "OVERDUE", "CANCELLED"]

export const STATUS_PEMBAYARAN = ["BERHASIL", "CANCELLED", "REFUNDED"]

export const STATUS_KELUARGA = [
    "KEPALA_KELUARGA",
    "SUAMI",
    "ISTRI",
    "ANAK",
    "ORANG_TUA",
    "LAINNYA",
] as const

export const JENIS_KEUANGAN = ["PEMASUKAN", "PENGELUARAN"] as const

export const JENIS_PESERTA = ["RUMAH", "KOS", "TEMPAT_USAHA", "LAINNYA"] as const

export type StatusKeluarga = (typeof STATUS_KELUARGA)[number]
export type UserRole = (typeof USER_ROLES)[number]
export type AssignableUserRole = (typeof ASSIGNABLE_USER_ROLES)[number]
export type PeriodeIuran = (typeof PERIODE_IURAN)[number]
export type StatusTagihan = (typeof STATUS_TAGIHAN)[number]
export type StatusPembayaran = (typeof STATUS_PEMBAYARAN)[number]
export type JenisKeuangan = (typeof JENIS_KEUANGAN)[number]
export type JenisPeserta = (typeof JENIS_PESERTA)[number]
