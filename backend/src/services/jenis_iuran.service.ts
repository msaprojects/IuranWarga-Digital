import { db } from "../prisma/db.ts"
import { HttpError } from "../utils/http_error.ts"

type PeriodeIuran = "HARIAN" | "MINGGUAN" | "BULANAN" | "TAHUNAN"

export type CreateJenisIuranInput = {
    judul: string
    periode_iuran: PeriodeIuran
    nominal: number
    tanggal_awal: Date
    tanggal_akhir: Date
    organisasi_id: number
    isActive?: boolean
}

export type UpdateJenisIuranInput = Partial<
    Pick<
        CreateJenisIuranInput,
        "judul" | "periode_iuran" | "nominal" | "tanggal_awal" | "tanggal_akhir" | "isActive"
    >
>

class JenisIuranService {
    async getJenisIuranByKodeOrganisasi(kode: string) {
        const organisasi = await db.orm.public.organisasi.where({ kode, isActive: true }).first()
        if (!organisasi) {
            throw new HttpError(404, "Organisasi not found")
        }
        return db.orm.public.jenis_iuran.where({ organisasi_id: organisasi.id }).all()
    }

    async getJenisIuranByID(id: number) {
        return db.orm.public.jenis_iuran.where({ id }).first()
    }

    async createJenisIuran(input: CreateJenisIuranInput) {
        const organisasi = await db.orm.public.organisasi
            .where({
                id: input.organisasi_id,
                isActive: true,
            })
            .first()
        if (!organisasi) {
            throw new HttpError(404, "Organisasi tidak ditemukan / sudah tidak aktif")
        }
        return await db.orm.public.jenis_iuran.create({
            ...input,
            nominal: String(input.nominal),
        })
    }

    async updateJenisIuran(id: number, input: UpdateJenisIuranInput) {
        const jenis_iuran = await db.orm.public.jenis_iuran.where({ id }).first()

        if (!jenis_iuran) {
            throw new HttpError(404, "Jenis Iuran Tidak Aktif")
        }

        return db.orm.public.jenis_iuran.where({ id }).update({
            judul: input.judul ?? jenis_iuran.judul,
            periode_iuran: input.periode_iuran ?? jenis_iuran.periode_iuran,
            nominal: input.nominal != null ? String(input.nominal) : jenis_iuran.nominal,
            tanggal_awal: input.tanggal_awal ?? jenis_iuran.tanggal_awal,
            tanggal_akhir: input.tanggal_akhir ?? jenis_iuran.tanggal_akhir,
            isActive: input.isActive ?? jenis_iuran.isActive,
        })
    }

    async deleteJenisIuran(id: number) {
        const jenis_iuran = await db.orm.public.jenis_iuran.where({ id }).first()
        if (!jenis_iuran) {
            throw new HttpError(404, "Jenis Iuran Tidak Aktif")
        }
        return db.orm.public.jenis_iuran.where({ id }).delete()
    }
}

export const jenisIuranService = new JenisIuranService()
