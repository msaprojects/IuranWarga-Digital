import { Temporal } from "temporal-polyfill"
import { db } from "../prisma/db.ts"
import { ConflictError, NotFoundError } from "../utils/http_error.ts"
import { generateRandomCode } from "../utils/helper.ts"
import { toCents } from "../utils/money.ts"
import dayjs from "../utils/dayjs.ts"
import type { StatusPembayaran, StatusTagihan } from "../utils/constanta.ts"
import { keuanganService } from "./keuangan.service.ts"
import type { TxContext } from "./keuangan.service.ts"

export type CreatePembayaranIuranInput = {
    tagihan_iuran_id: number
    nominal_bayar: string
    tanggal_bayar: string
}

export type FilterPembayaranIuran = {
    tagihan_iuran_id?: number
    peserta_id?: number
    status?: StatusPembayaran
    dari?: string
    sampai?: string
}

/** Bagian tagihan yang dibutuhkan untuk menghitung ulang statusnya. */
type TagihanRingkas = {
    id: number
    nominal_tagihan: string
    status: StatusTagihan
}

class PembayaranIuranService {
    async getAll(organisasi_id: number, filter: FilterPembayaranIuran = {}) {
        const { tagihan_iuran_id, peserta_id, status, dari, sampai } = filter
        let collection = db.orm.public.pembayaran_iuran.where({
            organisasi_id,
            ...(tagihan_iuran_id ? { tagihan_iuran_id } : {}),
            ...(peserta_id ? { peserta_id } : {}),
            ...(status ? { status } : {}),
        })
        if (dari) {
            const batas = Temporal.PlainDate.from(dari)
            collection = collection.where((m) => m.tanggal_bayar.gte(batas))
        }
        if (sampai) {
            const batas = Temporal.PlainDate.from(sampai)
            collection = collection.where((m) => m.tanggal_bayar.lte(batas))
        }
        return collection
            .orderBy((m) => m.tanggal_bayar.desc())
            .orderBy((m) => m.id.desc())
            .all()
    }

    async getById(id: number, organisasi_id: number) {
        const pembayaran = await db.orm.public.pembayaran_iuran.where({ id, organisasi_id }).first()
        if (!pembayaran) {
            throw new NotFoundError("Pembayaran iuran tidak ditemukan.", {
                code: "PEMBAYARAN.NOT_FOUND",
            })
        }
        return pembayaran
    }

    /**
     * Mencatat satu pembayaran (append-only).
     *
     * `jenis_iuran_id` dan `peserta_id` disalin dari tagihan sebagai snapshot,
     * sehingga histori transaksi tetap terbaca walau tagihan berubah. Status
     * tagihan diturunkan ulang dari total pembayaran BERHASIL, bukan dari
     * nominal yang dikirim klien.
     */
    async create(input: CreatePembayaranIuranInput, organisasi_id: number, user_id: number) {
        return db.transaction(async (tx) => {
            const tagihan = await tx.orm.public.tagihan_iuran
                .where({ id: input.tagihan_iuran_id, organisasi_id, deletedAt: null })
                .first()
            if (!tagihan) {
                throw new NotFoundError("Tagihan iuran tidak ditemukan.", {
                    code: "TAGIHAN.NOT_FOUND",
                })
            }
            if (tagihan.status === "CANCELLED") {
                throw new ConflictError("Tagihan sudah dibatalkan.", {
                    code: "TAGIHAN.CANCELLED",
                })
            }

            const sisa = await this.sisaTagihan(tx, tagihan)
            if (sisa <= 0n) {
                throw new ConflictError("Tagihan sudah lunas.", {
                    code: "PEMBAYARAN.TAGIHAN_LUNAS",
                })
            }
            if (toCents(input.nominal_bayar) > sisa) {
                throw new ConflictError("Nominal pembayaran melebihi sisa tagihan.", {
                    code: "PEMBAYARAN.MELEBIHI_SISA",
                })
            }

            const pembayaran = await tx.orm.public.pembayaran_iuran.create({
                nomor_transaksi: this.nomorTransaksi(
                    tagihan.tahun,
                    tagihan.bulan,
                    tagihan.peserta_id,
                ),
                organisasi_id,
                tagihan_iuran_id: tagihan.id,
                jenis_iuran_id: tagihan.jenis_iuran_id,
                peserta_id: tagihan.peserta_id,
                nominal_bayar: input.nominal_bayar,
                tanggal_bayar: Temporal.PlainDate.from(input.tanggal_bayar),
                status: "BERHASIL",
                user_id,
            })

            await this.sinkronStatusTagihan(tx, tagihan)
            return pembayaran
        })
    }

    /**
     * Membatalkan pembayaran yang belum diposting.
     *
     * Nominal tidak pernah diubah — pembatalan hanya memindahkan status dan
     * mengembalikan status tagihan. Pembayaran yang sudah masuk buku keuangan
     * ditolak: mengeluarkannya butuh jurnal balik, bukan perubahan status.
     */
    async cancel(id: number, organisasi_id: number) {
        return db.transaction(async (tx) => {
            const pembayaran = await tx.orm.public.pembayaran_iuran
                .where({ id, organisasi_id })
                .first()
            if (!pembayaran) {
                throw new NotFoundError("Pembayaran iuran tidak ditemukan.", {
                    code: "PEMBAYARAN.NOT_FOUND",
                })
            }
            if (pembayaran.status !== "BERHASIL") {
                throw new ConflictError(
                    "Hanya pembayaran berstatus BERHASIL yang dapat dibatalkan.",
                    {
                        code: "PEMBAYARAN.TIDAK_BERHASIL",
                    },
                )
            }
            if (pembayaran.postedAt !== null) {
                throw new ConflictError(
                    "Pembayaran sudah diposting ke buku keuangan; koreksi harus lewat jurnal balik.",
                    { code: "PEMBAYARAN.SUDAH_DIPOSTING" },
                )
            }

            const tagihan = await tx.orm.public.tagihan_iuran
                .where({ id: pembayaran.tagihan_iuran_id, organisasi_id })
                .first()

            const dibatalkan = await tx.orm.public.pembayaran_iuran.where({ id }).update({
                status: "CANCELLED",
                updatedAt: dayjs().toISOString(),
            })

            if (tagihan) {
                await this.sinkronStatusTagihan(tx, tagihan)
            }
            return dibatalkan
        })
    }

    /**
     * Memposting pembayaran ke buku keuangan (sekali saja).
     *
     * Satu transaksi menulis jurnal + menandai `postedAt`; bila salah satu
     * gagal, keduanya batal sehingga tidak ada pembayaran yang tampak
     * terposting tanpa jurnal.
     */
    async posting(id: number, organisasi_id: number, user_id: number, keterangan?: string) {
        return db.transaction(async (tx) => {
            const pembayaran = await tx.orm.public.pembayaran_iuran
                .where({ id, organisasi_id })
                .first()
            if (!pembayaran) {
                throw new NotFoundError("Pembayaran iuran tidak ditemukan.", {
                    code: "PEMBAYARAN.NOT_FOUND",
                })
            }
            if (pembayaran.status !== "BERHASIL") {
                throw new ConflictError("Pembayaran tidak berstatus BERHASIL.", {
                    code: "PEMBAYARAN.TIDAK_BERHASIL",
                })
            }
            if (pembayaran.postedAt !== null) {
                throw new ConflictError("Pembayaran sudah pernah diposting.", {
                    code: "PEMBAYARAN.SUDAH_DIPOSTING",
                })
            }

            const tagihan = await tx.orm.public.tagihan_iuran
                .where({ id: pembayaran.tagihan_iuran_id, organisasi_id })
                .first()

            const jurnal = await keuanganService.catatJurnal(tx, {
                organisasi_id,
                // Output kolom `date` sudah berupa Temporal.PlainDate, jadi bisa
                // diteruskan apa adanya sebagai input kolom yang sama.
                tanggal: pembayaran.tanggal_bayar,
                jenis_keuangan: "PEMASUKAN",
                user_id,
                keterangan: keterangan ?? `Pembayaran ${pembayaran.nomor_transaksi}`,
                sub_organisasi_id: tagihan?.sub_organisasi_id ?? null,
                system_details: JSON.stringify({
                    sumber: "PEMBAYARAN_IURAN",
                    pembayaran_iuran_id: pembayaran.id,
                    nomor_transaksi: pembayaran.nomor_transaksi,
                    tagihan_iuran_id: pembayaran.tagihan_iuran_id,
                }),
                details: [
                    {
                        nominal: pembayaran.nominal_bayar,
                        keterangan: pembayaran.nomor_transaksi,
                        pembayaran_iuran_id: pembayaran.id,
                    },
                ],
            })

            await tx.orm.public.pembayaran_iuran.where({ id }).update({
                postedAt: dayjs().toISOString(),
                updatedAt: dayjs().toISOString(),
            })

            return jurnal
        })
    }

    /** Sisa tagihan = nominal tagihan − total pembayaran BERHASIL. */
    private async sisaTagihan(tx: TxContext, tagihan: TagihanRingkas): Promise<bigint> {
        const terbayar = await tx.orm.public.pembayaran_iuran
            .where({ tagihan_iuran_id: tagihan.id, status: "BERHASIL" })
            .aggregate((aggregate) => ({ total: aggregate.sum("nominal_bayar") }))
        return toCents(tagihan.nominal_tagihan) - toCents(terbayar.total ?? "0")
    }

    /**
     * Menurunkan ulang status tagihan dari total pembayaran BERHASIL.
     *
     * Satu-satunya sumber kebenaran status adalah tabel pembayaran, sehingga
     * pembatalan tidak perlu "mengingat" status sebelumnya.
     */
    private async sinkronStatusTagihan(tx: TxContext, tagihan: TagihanRingkas) {
        // Tagihan CANCELLED bersifat final; jangan dihidupkan oleh pembayaran.
        if (tagihan.status === "CANCELLED") return

        const sisa = await this.sisaTagihan(tx, tagihan)
        const nominal = toCents(tagihan.nominal_tagihan)
        const target: StatusTagihan =
            sisa >= nominal ? "BELUM_BAYAR" : sisa <= 0n ? "SUDAH_BAYAR" : "PARTIAL"

        if (target === tagihan.status) return
        await tx.orm.public.tagihan_iuran.where({ id: tagihan.id }).update({
            status: target,
            updatedAt: dayjs().toISOString(),
        })
    }

    private nomorTransaksi(tahun: number, bulan: number | null, peserta_id: number): string {
        const periode = `${tahun}${bulan === null ? "00" : String(bulan).padStart(2, "0")}`
        // Nomor transaksi unik global: periode + peserta + sufiks acak.
        return `PAY-${periode}-${peserta_id}${generateRandomCode(4, 4)}`
    }
}

export const pembayaranIuranService = new PembayaranIuranService()
