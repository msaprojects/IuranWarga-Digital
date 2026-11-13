import { db } from "../prisma/db.ts"
import { ConflictError, NotFoundError } from "../utils/http_error.ts"
import { generateRandomCode } from "../utils/helper.ts"
import dayjs from "../utils/dayjs.ts"
import { Temporal } from "temporal-polyfill"

export type CreateTagihanIuranInput = {
    organisasi_id: number
    jenis_iuran_id: number
    tahun: number
    bulan: number
    nominal_tagihan: string
}

export type UpdateTagihanIuranInput = {
    jenis_iuran_id: number
    tahun: number
    bulan: number
    nominal_tagihan: string
}

class TagihanIuranService {
    async getAll(organisasi_id: number) {
        const response = await db.orm.public.tagihan_iuran
            .where({
                organisasi_id: organisasi_id,
            })
            .all()
        if (!response) {
            throw new NotFoundError("Tagihan Iuran Tidak Ditemukan")
        }
        return response
    }

    // Buat tagihan secara manual.
    async create(input: CreateTagihanIuranInput) {
        // check organisasi
        const organisasi = await db.orm.public.organisasi
            .where({
                id: input.organisasi_id,
                isActive: true,
            })
            .first()
        if (!organisasi) {
            throw new NotFoundError("Organisasi Tidak Ditemukan")
        }
        // check jenis_iuran — wajib milik organisasi yang sama dengan tagihan,
        // kalau tidak, jenis iuran organisasi lain bisa dipakai lintas tenant.
        const jenisIuran = await db.orm.public.jenis_iuran
            .where({
                id: input.jenis_iuran_id,
                organisasi_id: input.organisasi_id,
                isActive: true,
            })
            .first()
        if (!jenisIuran) {
            throw new NotFoundError("Jenis Iuran Tidak Ditemukan")
        }
        // check data peserta active by organisasi
        const peserta = await db.orm.public.peserta
            .where({
                organisasi_id: input.organisasi_id,
                isActive: true,
            })
            .all()
        if (peserta.length === 0) {
            throw new NotFoundError("Tidak ada peserta aktif dalam organisasi ini")
        }

        const existingTagihan = await db.orm.public.tagihan_iuran
            .where({
                organisasi_id: input.organisasi_id,
                jenis_iuran_id: input.jenis_iuran_id,
                tahun: input.tahun,
                bulan: input.bulan,
            })
            .all()

        // Skip peserta yang sudah punya tagihan pada periode yang sama agar tidak duplikasi.
        const billedPesertaIds = new Set(existingTagihan.map((tagihan) => tagihan.peserta_id))
        const pesertaBelumDitagih = peserta.filter((data) => !billedPesertaIds.has(data.id))
        if (pesertaBelumDitagih.length === 0) {
            throw new ConflictError(
                "Semua peserta aktif sudah memiliki tagihan pada periode ini.",
                {
                    code: "TAGIHAN.ALREADY_ISSUED",
                },
            )
        }

        const tanggalTerbit = Temporal.PlainDate.from(dayjs().format("YYYY-MM-DD"))
        const dataTagihan = pesertaBelumDitagih.map((p) => ({
            organisasi_id: input.organisasi_id,
            jenis_iuran_id: input.jenis_iuran_id,
            tahun: input.tahun,
            bulan: input.bulan,
            nominal_tagihan: input.nominal_tagihan,
            peserta_id: p.id,
            // Field wajib tanpa default di kolom: buat nomor unik per periode & peserta.
            nomor_tagihan: `TAG-${input.tahun}${input.bulan}-${p.id}${generateRandomCode(4, 4)}`,
            status: "BELUM_BAYAR" as const,
            tanggal_terbit: tanggalTerbit,
        }))

        return await db.orm.public.tagihan_iuran.createAll(dataTagihan)
    }

    // `organisasi_id` berasal dari tenant token (bukan path/body) sehingga
    // tagihan milik organisasi lain tidak bisa disentuh walau id-nya ditebak.
    async update(id: number, organisasi_id: number, input: UpdateTagihanIuranInput) {
        const scope = { id, organisasi_id, deletedAt: null }
        const tagihan = await db.orm.public.tagihan_iuran.where(scope).first()
        if (!tagihan) {
            throw new NotFoundError("Tagihan Iuran Tidak Ditemukan")
        }

        // Pindah jenis iuran baru divalidasi saat nilainya benar-benar berubah:
        // target wajib aktif dan berada di organisasi yang sama. PATCH yang
        // hanya mengoreksi nominal tetap jalan walau jenis iuran yang sudah
        // menempel di tagihan itu belakangan dinonaktifkan.
        if (input.jenis_iuran_id !== tagihan.jenis_iuran_id) {
            const jenisIuran = await db.orm.public.jenis_iuran
                .where({ id: input.jenis_iuran_id, organisasi_id, isActive: true })
                .first()
            if (!jenisIuran) {
                throw new NotFoundError("Jenis Iuran Tidak Ditemukan")
            }
        }

        return await db.orm.public.tagihan_iuran.where(scope).update({
            jenis_iuran_id: input.jenis_iuran_id,
            tahun: input.tahun,
            bulan: input.bulan,
            nominal_tagihan: input.nominal_tagihan,
        })
    }

    async delete(id: number, organisasi_id: number, deletedBy: number, deletedReason: string) {
        const scope = { id, organisasi_id, deletedAt: null }
        const tagihan = await db.orm.public.tagihan_iuran.where(scope).first()
        if (!tagihan) {
            throw new NotFoundError("Tagihan Iuran Tidak Ditemukan")
        }
        return await db.orm.public.tagihan_iuran.where(scope).update({
            deletedAt: dayjs().toISOString(),
            deletedBy,
            deletedDescription: deletedReason,
        })
    }
}

export const tagihanIuranService = new TagihanIuranService()
