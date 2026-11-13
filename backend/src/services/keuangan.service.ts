import { Temporal } from "temporal-polyfill"
import { db } from "../prisma/db.ts"
import { NotFoundError } from "../utils/http_error.ts"
import { fromCents, toCents } from "../utils/money.ts"
import { LEDGER_SIGN } from "../utils/constanta.ts"
import type { JenisKeuangan } from "../utils/constanta.ts"

/**
 * Konteks transaksi Prisma 8 — parameter `tx` di dalam `db.transaction`.
 *
 * Diturunkan dari tipe `db.transaction` (bukan dideklarasikan ulang) supaya
 * ikut berubah bila kontrak ORM berganti; ini yang memungkinkan penulisan
 * jurnal ikut transaksi pemanggil tanpa membuka transaksi bersarang.
 */
export type TxContext = Parameters<Parameters<typeof db.transaction>[0]>[0]

export type DetailKeuanganInput = {
    nominal: string
    keterangan?: string
    /** Diisi hanya oleh jalur posting pembayaran iuran. */
    pembayaran_iuran_id?: number
}

export type CatatJurnalInput = {
    organisasi_id: number
    tanggal: Temporal.PlainDate
    jenis_keuangan: JenisKeuangan
    user_id?: number | null
    keterangan?: string | null
    /** Diteruskan ke setiap kaki ledger; null untuk jurnal umum. */
    sub_organisasi_id?: number | null
    /** Jejak asal jurnal, mis. nomor transaksi pembayaran. */
    system_details?: string | null
    details: DetailKeuanganInput[]
}

export type CreateKeuanganInput = {
    jenis_keuangan: JenisKeuangan
    tanggal: string
    keterangan?: string
    detail: { nominal: string; keterangan?: string }[]
}

export type FilterKeuangan = {
    jenis_keuangan?: JenisKeuangan
    dari?: string
    sampai?: string
}

class KeuanganService {
    async getAll(organisasi_id: number, filter: FilterKeuangan = {}) {
        const { jenis_keuangan, dari, sampai } = filter
        // Filter disusun dari field yang benar-benar dikirim: mengoper nilai
        // `undefined` ke `.where()` berisiko menjadi predikat `IS NULL`.
        let collection = db.orm.public.keuangan.where({
            organisasi_id,
            ...(jenis_keuangan ? { jenis_keuangan } : {}),
        })
        if (dari) {
            const batas = Temporal.PlainDate.from(dari)
            collection = collection.where((m) => m.tanggal.gte(batas))
        }
        if (sampai) {
            const batas = Temporal.PlainDate.from(sampai)
            collection = collection.where((m) => m.tanggal.lte(batas))
        }
        return collection
            .orderBy((m) => m.tanggal.desc())
            .orderBy((m) => m.id.desc())
            .all()
    }

    async getById(id: number, organisasi_id: number) {
        const keuangan = await db.orm.public.keuangan.where({ id, organisasi_id }).first()
        if (!keuangan) {
            throw new NotFoundError("Transaksi keuangan tidak ditemukan.", {
                code: "KEUANGAN.NOT_FOUND",
            })
        }

        // `keuangan_detail.deletedAt` = baris rincian yang dibatalkan; baris
        // ledger tidak pernah dihapus sehingga selalu dikembalikan utuh.
        const [detail, ledger] = await Promise.all([
            db.orm.public.keuangan_detail.where({ keuangan_id: id, deletedAt: null }).all(),
            db.orm.public.transaction_ledger.where({ keuangan_id: id }).all(),
        ])

        return { ...keuangan, detail, ledger }
    }

    /**
     * Jurnal umum (tanpa keterkaitan ke pembayaran iuran).
     *
     * Nominal jurnal diturunkan dari rincian oleh service, bukan dari body,
     * sehingga header dan detail tidak mungkin bertentangan.
     */
    async create(input: CreateKeuanganInput, organisasi_id: number, user_id: number) {
        return db.transaction((tx) =>
            this.catatJurnal(tx, {
                organisasi_id,
                tanggal: Temporal.PlainDate.from(input.tanggal),
                jenis_keuangan: input.jenis_keuangan,
                user_id,
                keterangan: input.keterangan ?? null,
                details: input.detail,
            }),
        )
    }

    /**
     * Menulis satu jurnal lengkap: header `keuangan`, rincian
     * `keuangan_detail`, dan kaki `transaction_ledger`.
     *
     * Wajib dipanggil dengan `tx` milik pemanggil agar jurnal ikut rollback
     * bila langkah berikutnya gagal (mis. update `postedAt` pembayaran).
     */
    async catatJurnal(tx: TxContext, input: CatatJurnalInput) {
        const keuangan = await tx.orm.public.keuangan.create({
            organisasi_id: input.organisasi_id,
            tanggal: input.tanggal,
            user_id: input.user_id ?? null,
            keterangan: input.keterangan ?? null,
            jenis_keuangan: input.jenis_keuangan,
        })

        const detail = await tx.orm.public.keuangan_detail.createAll(
            input.details.map((item) => ({
                keuangan_id: keuangan.id,
                nominal: item.nominal,
                pembayaran_iuran_id: item.pembayaran_iuran_id ?? null,
                keterangan: item.keterangan ?? null,
            })),
        )

        // Double-entry: total jurnal dibukukan sebagai sepasang kaki DEBIT dan
        // KREDIT dengan nominal sama, sehingga buku selalu seimbang.
        const total = fromCents(
            input.details.reduce((acc, item) => acc + toCents(item.nominal), 0n),
        )

        const ledger = await tx.orm.public.transaction_ledger.createAll(
            LEDGER_SIGN.map((tipe) => ({
                keuangan_id: keuangan.id,
                organisasi_id: input.organisasi_id,
                user_id: input.user_id ?? null,
                sub_organisasi_id: input.sub_organisasi_id ?? null,
                nominal: total,
                tipe,
                system_details: input.system_details ?? null,
            })),
        )

        return { ...keuangan, detail, ledger }
    }
}

export const keuanganService = new KeuanganService()
