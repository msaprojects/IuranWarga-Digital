import { db } from "../prisma/db.ts"
import type { Models } from "../prisma/contract.d"
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/http_error.ts"
import { orgService } from "./organisasi.service.ts"
import type { SumberTagihan, StatusTagihan } from "../utils/constanta.ts"
import {
    comparePlainDate,
    computePeriodeKey,
    dateToPlainDate,
    parsePeriode,
    periodRange,
    startOfTodayPlainDate,
} from "../utils/periode.ts"

// ---------- types ----------

// Baris `jenis_iuran` hasil query ORM hanya berisi kolom scalar (relasi tidak ikut
// ter-bawa tanpa include/lookup), jadi buang field relasi wajib dari tipe.
type JenisIuranRow = Omit<Models.public_jenis_iuran, "organisasi" | "tagihan_iuran">

export type IssueTagihanParams = {
    jenis_iuran_id: number
    /** Kunci periode kanonik (lihat utils/periode.ts). */
    periode: string
    /** Target eksplisit; kosong/undefined = semua peserta aktif yang cocok jenis_peserta-nya. */
    peserta_ids?: number[]
    source?: SumberTagihan
    issued_by?: number | null
    keterangan?: string | null
    /**
     * Organisasi milik pemanggil (dari JWT). Bila diisi, jenis_iuran WAJIB berada di
     * organisasi yang sama — mencegah penerbitan lintas organisasi lewat endpoint manual.
     */
    caller_organisasi_id?: number
}

export type IssueTagihanResult = {
    periode: string
    jenis_iuran_id: number
    created: number
    skipped: number
    tagihan: number[]
}

// ---------- helpers (pure) ----------

const isUniqueViolation = (err: unknown): boolean =>
    typeof err === "object" &&
    err !== null &&
    (err as { sqlState?: unknown }).sqlState === "23505"

/** Due date bersifat INKLUSIF: baru lewat tenggat mulai hari SETELAH jatuh_tempo. */
const isPastDueDate = (jatuhTempo: Temporal.PlainDate, today: Temporal.PlainDate): boolean =>
    comparePlainDate(jatuhTempo, today) < 0

const deriveStatus = (
    nominalTagihan: number,
    terbayar: number,
    pastDue: boolean,
): StatusTagihan => {
    if (terbayar >= nominalTagihan) return "SUDAH_BAYAR"
    if (pastDue) return "OVERDUE"
    if (terbayar > 0) return "PARTIAL"
    return "BELUM_BAYAR"
}

const sanitize = (s: string): string => s.replace(/[^A-Za-z0-9]+/g, "-")

const buildNomorTagihan = (
    orgKode: string,
    jenisId: number,
    pesertaId: number,
    periode: string,
): string => `TAG-${sanitize(orgKode)}-${jenisId}-${pesertaId}-${periode}`

// ---------- service ----------

class TagihanIuranService {
    // ---- idempotent primitives -------------------------------------------

    /**
     * SATU pintu penerbitan untuk jalur manual maupun cron.
     * Idempoten terhadap (peserta, jenis_iuran, periode): bila baris SUDAH ada —
     * termasuk yang di-soft-delete — ia TIDAK dibuat ulang dan tidak error.
     * Inilah yang mencegah tumpang tindih: panggilan ganda = no-op.
     */
    private async getOrCreateTagihan(
        jenis: JenisIuranRow,
        orgKode: string,
        peserta: { id: number },
        periode: string,
        opts: { source: SumberTagihan; issued_by: number | null; keterangan: string | null },
        now: Date,
    ): Promise<{ id: number; created: boolean }> {
        const existing = await db.orm.public.tagihan_iuran
            .where({ peserta_id: peserta.id, jenis_iuran_id: jenis.id, periode })
            .first()
        // Ada (aktif maupun soft-deleted) -> skip. Keputusan "deleted = skip re-issue".
        if (existing) {
            return { id: existing.id, created: false }
        }

        const range = periodRange(periode)
        const nominalTagihan = jenis.nominal
        const status = deriveStatus(
            Number(nominalTagihan),
            0,
            isPastDueDate(range.tanggal_jatuh_tempo, dateToPlainDate(now)),
        )

        try {
            const created = await db.orm.public.tagihan_iuran.create({
                nomor_tagihan: buildNomorTagihan(orgKode, jenis.id, peserta.id, periode),
                periode,
                organisasi_id: jenis.organisasi_id,
                jenis_iuran_id: jenis.id,
                peserta_id: peserta.id,
                tahun: range.tahun,
                bulan: range.bulan,
                tanggal_terbit: range.tanggal_terbit,
                tanggal_jatuh_tempo: range.tanggal_jatuh_tempo,
                nominal_tagihan: nominalTagihan,
                nominal_terbayar: "0",
                status,
                source: opts.source,
                issued_by: opts.issued_by,
                keterangan: opts.keterangan,
            })
            return { id: created.id, created: true }
        } catch (err) {
            // kalah balapan dengan writer lain (cron/manual serentak): anggap no-op.
            if (isUniqueViolation(err)) {
                const raced = await db.orm.public.tagihan_iuran
                    .where({ peserta_id: peserta.id, jenis_iuran_id: jenis.id, periode })
                    .first()
                if (raced) return { id: raced.id, created: false }
            }
            throw err
        }
    }

    /** Menyelesaikan daftar peserta target lalu memanggil getOrCreateTagihan untuk tiap baris. */
    private async issueForJenisEntity(
        jenis: JenisIuranRow,
        periode: string,
        opts: {
            source: SumberTagihan
            issued_by: number | null
            keterangan: string | null
            peserta_ids?: number[]
        },
        now: Date,
    ): Promise<IssueTagihanResult> {
        const granularity = parsePeriode(periode)?.granularity
        if (granularity !== jenis.periode_iuran) {
            throw new BadRequestError(
                `Periode "${periode}" tidak cocok dengan periode_iuran jenis iuran (${jenis.periode_iuran}).`,
                { code: "TAGIHAN.PERIODE_MISMATCH" },
            )
        }

        const organisasi = await db.orm.public.organisasi
            .where({ id: jenis.organisasi_id })
            .select("id", "kode")
            .first()
        if (!organisasi) {
            throw new NotFoundError("Organisasi jenis iuran tidak ditemukan.", {
                code: "ORG.NOT_FOUND",
            })
        }

        // Target peserta: eksplisit (tetap harus aktif & satu organisasi) ATAU semua
        // peserta aktif yang cocok jenis_peserta jenis_iuran ini.
        const targetPeserta = opts.peserta_ids?.length
            ? await db.orm.public.peserta
                  .where((p) => p.id.in(opts.peserta_ids!))
                  .where({ organisasi_id: jenis.organisasi_id, isActive: true })
                  .select("id")
                  .all()
            : await db.orm.public.peserta
                  .where({
                      organisasi_id: jenis.organisasi_id,
                      jenis_peserta: jenis.jenis_peserta,
                      isActive: true,
                  })
                  .select("id")
                  .all()

        let created = 0
        let skipped = 0
        const ids: number[] = []
        for (const peserta of targetPeserta) {
            const res = await this.getOrCreateTagihan(
                jenis,
                organisasi.kode,
                peserta,
                periode,
                { source: opts.source, issued_by: opts.issued_by, keterangan: opts.keterangan },
                now,
            )
            ids.push(res.id)
            if (res.created) created++
            else skipped++
        }

        return { periode, jenis_iuran_id: jenis.id, created, skipped, tagihan: ids }
    }

    // ---- public API ------------------------------------------------------

    /** Penerbitan manual/eksplisit (dipakai controller). */
    async issueTagihan(input: IssueTagihanParams): Promise<IssueTagihanResult> {
        const jenis = await db.orm.public.jenis_iuran.where({ id: input.jenis_iuran_id }).first()
        if (!jenis) {
            throw new NotFoundError("Jenis iuran tidak ditemukan.", { code: "JENIS.NOT_FOUND" })
        }
        if (!jenis.isActive) {
            throw new BadRequestError("Jenis iuran sudah tidak aktif.", {
                code: "JENIS.INACTIVE",
            })
        }
        if (input.caller_organisasi_id != null && jenis.organisasi_id !== input.caller_organisasi_id) {
            throw new ForbiddenError("Jenis iuran berada di organisasi lain.", {
                code: "TAGIHAN.CROSS_ORGANISASI",
            })
        }

        return this.issueForJenisEntity(
            jenis,
            input.periode,
            {
                source: input.source ?? "MANUAL",
                issued_by: input.issued_by ?? null,
                keterangan: input.keterangan ?? null,
                peserta_ids: input.peserta_ids,
            },
            new Date(),
        )
    }

    async getById(id: number) {
        const tagihan = await db.orm.public.tagihan_iuran.where({ id }).first()
        if (!tagihan) {
            throw new NotFoundError("Tagihan tidak ditemukan.", { code: "TAGIHAN.NOT_FOUND" })
        }
        return tagihan
    }

    async listByOrganisasiKode(kode: string) {
        const organisasi = await orgService.getByKode(kode)
        return db.orm.public.tagihan_iuran
            .where((t) => t.deletedAt.isNull())
            .where({ organisasi_id: organisasi.id })
            .all()
    }

    // ---- status derivation (single source of truth = payments) ------------

    private async sumTerbayar(tagihanId: number): Promise<number> {
        const rows = await db.orm.public.pembayaran_iuran
            .where((p) => p.tagihan_iuran_id.eq(tagihanId))
            .where((p) => p.status.eq("BERHASIL"))
            .select("nominal_bayar")
            .all()
        return rows.reduce((acc, r) => acc + Number(r.nominal_bayar), 0)
    }

    /**
     * Menghitung ulang nominal_terbayar + status sebuah tagihan dari baris pembayaran.
     * Status TIDAK pernah di-set manual; selalu diturunkan dari pembayaran (keputusan #4).
     * Dipanggil setiap ada pembayaran baru dan oleh cron harian untuk flag OVERDUE.
     */
    async syncTagihanStatus(id: number): Promise<void> {
        const tagihan = await db.orm.public.tagihan_iuran.where({ id }).first()
        if (!tagihan) return

        const terbayar = await this.sumTerbayar(id)

        // Hindari membaca value Date dari DB (bisa berupa Temporal): gunakan perbandingan SQL.
        const pastDueRow = await db.orm.public.tagihan_iuran
            .where((t) => t.id.eq(id))
            .where((t) => t.tanggal_jatuh_tempo.lt(startOfTodayPlainDate()))
            .select("id")
            .first()
        const pastDue = pastDueRow !== null

        const status = deriveStatus(Number(tagihan.nominal_tagihan), terbayar, pastDue)

        await db.orm.public.tagihan_iuran.where({ id }).update({
            nominal_terbayar: String(terbayar),
            status,
        })
    }

    // ---- cron jobs -------------------------------------------------------

    /**
     * Jalur cron: terbitkan tagihan untuk periode berjalan bagi semua jenis_iuran aktif
     * di setiap organisasi aktif. Idempoten — aman dijalankan berulang / di-retry.
     */
    async runGenerateCurrentPeriod(): Promise<{ jenis_processed: number; created: number }> {
        const now = new Date()
        const orgs = await db.orm.public.organisasi.where({ isActive: true }).select("id").all()

        let jenisProcessed = 0
        let created = 0

        for (const org of orgs) {
            const jenisList = await db.orm.public.jenis_iuran
                .where({ organisasi_id: org.id, isActive: true })
                .all()

            for (const jenis of jenisList) {
                const periode = computePeriodeKey(jenis.periode_iuran, now)
                const res = await this.issueForJenisEntity(
                    jenis,
                    periode,
                    { source: "CRON", issued_by: null, keterangan: null },
                    now,
                )
                jenisProcessed++
                created += res.created
            }
        }

        return { jenis_processed: jenisProcessed, created }
    }

    /**
     * Jalur cron harian: turunkan status tagihan yang melewati tenggat (flag OVERDUE,
     * keputusan #2). Tetap memakai derivation dari pembayaran agar tidak ada drift.
     */
    async runMarkOverdue(): Promise<{ checked: number }> {
        const candidates = await db.orm.public.tagihan_iuran
            .where((t) => t.deletedAt.isNull())
            .where((t) => t.status.in(["BELUM_BAYAR", "PARTIAL"]))
            .where((t) => t.tanggal_jatuh_tempo.lt(startOfTodayPlainDate()))
            .select("id")
            .all()

        for (const c of candidates) {
            await this.syncTagihanStatus(c.id)
        }

        return { checked: candidates.length }
    }

    /** Ring satu pintu untuk scheduler harian. */
    async runDailyJob(): Promise<{ generated: { jenis_processed: number; created: number }; overdue: { checked: number } }> {
        const generated = await this.runGenerateCurrentPeriod()
        const overdue = await this.runMarkOverdue()
        return { generated, overdue }
    }
}

export const tagihanIuranService = new TagihanIuranService()
