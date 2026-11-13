/**
 * Aritmetika uang untuk kolom `Decimal`.
 *
 * Prisma 8 mengembalikan `numeric` PostgreSQL sebagai string desimal (mis.
 * "50000.50"). Menjumlah/membandingkan lewat `Number` rawan galat
 * floating-point — mis. `0.1 + 0.2 !== 0.3` — dan galat itu langsung terlihat
 * saat memutuskan status lunas sebuah tagihan. Karena itu semua operasi di sini
 * dikerjakan dalam satuan sen sebagai `BigInt`.
 *
 * Kontrak domain: nominal selalu non-negatif (validator menolak nilai <= 0),
 * jadi `toCents` tidak menangani tanda minus. `fromCents` tetap menanganinya
 * agar tidak menghasilkan output yang salah bila dipakai untuk selisih.
 */

/** "50000.5" -> 5000050n */
export function toCents(value: string): bigint {
    const [whole = "0", fraction = ""] = value.trim().split(".")
    // `fraction + "00"` membuat potongan 2 digit, termasuk saat desimal kosong.
    return BigInt(whole) * 100n + BigInt(`${fraction}00`.slice(0, 2))
}

/** 5000050n -> "50000.50" */
export function fromCents(cents: bigint): string {
    const negative = cents < 0n
    const magnitude = negative ? -cents : cents
    const whole = magnitude / 100n
    const fraction = (magnitude % 100n).toString().padStart(2, "0")
    return `${negative ? "-" : ""}${whole}.${fraction}`
}
