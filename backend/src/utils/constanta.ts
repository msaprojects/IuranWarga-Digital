// Role user: satu sumber kebenaran untuk service, validator, dan docs.
// Nilai HARUS sama dengan enum `Role` di Prisma contract (USER, ADMIN, SUPER_ADMIN).
// `const enum` lama memakai "SUPERADMIN" (tanpa underscore) yang tidak cocok dengan DB.
export const USER_ROLES = ["USER", "ADMIN", "SUPER_ADMIN"] as const
export type UserRole = (typeof USER_ROLES)[number]

// Role yang boleh ditetapkan via API (create/update user biasa).
// SUPER_ADMIN sengaja TIDAK termasuk → mencegah eskalasi privilege lewat endpoint.
export const ASSIGNABLE_USER_ROLES = ["USER", "ADMIN"] as const
export type AssignableUserRole = (typeof ASSIGNABLE_USER_ROLES)[number]

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
