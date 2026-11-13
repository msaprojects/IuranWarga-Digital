import { db } from "../prisma/db.ts"
import { NotFoundError } from "../utils/http_error.ts"
import dayjs from "../utils/dayjs.ts"
import type { LedgerSign } from "../utils/constanta.ts"

export type FilterTransactionLedger = {
    keuangan_id?: number
    sub_organisasi_id?: number
    tipe?: LedgerSign
    dari?: string
    sampai?: string
    limit?: number
}

/**
 * Log transaksi (buku besar) — READ ONLY.
 *
 * Baris dibuat hanya oleh `keuanganService.catatJurnal`, jadi tidak ada
 * `create`/`update`/`delete` di sini: satu-satunya cara memperbaiki histori
 * adalah menambah jurnal baru.
 */
class TransactionLedgerService {
    async getAll(organisasi_id: number, filter: FilterTransactionLedger = {}) {
        const { keuangan_id, sub_organisasi_id, tipe, dari, sampai, limit } = filter
        // Filter opsional disusun sebagai spread kondisional agar nilai
        // `undefined` tidak ikut menjadi predikat `IS NULL`.
        let collection = db.orm.public.transaction_ledger.where({
            organisasi_id,
            ...(keuangan_id ? { keuangan_id } : {}),
            ...(sub_organisasi_id ? { sub_organisasi_id } : {}),
            ...(tipe ? { tipe } : {}),
        })
        // `createdAt` ber-codec `pg/timestamptz-string@1`: nilainya string ISO,
        // jadi batas rentang dibandingkan sebagai string, bukan Temporal.
        if (dari) {
            const batas = dayjs.utc(dari).startOf("day").toISOString()
            collection = collection.where((m) => m.createdAt.gte(batas))
        }
        if (sampai) {
            // Memakai batas eksklusif hari berikutnya, bukan `endOf("day")`:
            // Postgres menyimpan mikrodetik sehingga `23:59:59.999` bisa
            // memotong baris yang tersimpan pada sisa mikrodetik terakhir.
            const batas = dayjs.utc(sampai).startOf("day").add(1, "day").toISOString()
            collection = collection.where((m) => m.createdAt.lt(batas))
        }
        return collection
            .orderBy((m) => m.createdAt.desc())
            .orderBy((m) => m.id.desc())
            .limit(limit ?? 100)
            .all()
    }

    async getById(id: string, organisasi_id: number) {
        const ledger = await db.orm.public.transaction_ledger.where({ id, organisasi_id }).first()
        if (!ledger) {
            throw new NotFoundError("Entri log transaksi tidak ditemukan.", {
                code: "LEDGER.NOT_FOUND",
            })
        }
        return ledger
    }
}

export const transactionLedgerService = new TransactionLedgerService()
