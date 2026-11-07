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
        // check jenis_iuran
        const jenisIuran = await db.orm.public.jenis_iuran
            .where({
                id: input.jenis_iuran_id,
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
            throw new ConflictError("Semua peserta aktif sudah memiliki tagihan pada periode ini.", {
                code: "TAGIHAN.ALREADY_ISSUED",
            })
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
            nominal_terbayar: "0",
            status: "BELUM_BAYAR" as const,
            tanggal_terbit: tanggalTerbit,
        }))

        return await db.orm.public.tagihan_iuran.createAll(dataTagihan)
    }

    async update(id: number, input: UpdateTagihanIuranInput) {
        const tagihan = await db.orm.public.tagihan_iuran
            .where({
                id: id,
                deletedAt: null,
            })
            .first()
        if (!tagihan) {
            throw new NotFoundError("Tagihan Iuran Tidak Ditemukan")
        }

        return await db.orm.public.tagihan_iuran.where({ id: id, deletedAt: null }).update({
            jenis_iuran_id: input.jenis_iuran_id,
            tahun: input.tahun,
            bulan: input.bulan,
            nominal_tagihan: input.nominal_tagihan,
        })
    }

    async delete(id: number, deletedBy: number, deletedReason: string) {
        const tagihan = await db.orm.public.tagihan_iuran
            .where({
                id: id,
                deletedAt: null,
            })
            .first()
        if (!tagihan) {
            throw new NotFoundError("Tagihan Iuran Tidak Ditemukan")
        }
        return await db.orm.public.tagihan_iuran.where({ id: id, deletedAt: null }).update({
            deletedAt: dayjs().toISOString(),
            deletedBy,
            deletedDescription: deletedReason,
        })
    }
}

export const tagihanIuranService = new TagihanIuranService()
