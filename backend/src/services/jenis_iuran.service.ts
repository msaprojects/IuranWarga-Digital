import { db } from "../prisma/db.ts"
import { HttpError } from "../utils/http_error.ts"
import { orgService } from "./organisasi.service.ts"
import type { PeriodeIuran } from "../utils/constanta.ts"

export type CreateJenisIuranInput = {
    judul: string
    periode_iuran: PeriodeIuran
    nominal: string
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
    /**
     * Invariant domain: tanggal akhir tidak boleh mendahului tanggal awal.
     * Ditempatkan di service agar berlaku untuk create maupun update,
     * tidak hanya pada validasi input di lapisan transport.
     */
    private assertTanggalRentangValid(tanggal_awal: Date, tanggal_akhir: Date) {
        if (tanggal_akhir.getTime() < tanggal_awal.getTime()) {
            throw new HttpError(400, "tanggal_akhir tidak boleh sebelum tanggal_awal.")
        }
    }

    async getJenisIuranByKodeOrganisasi(kode: string) {
        const organisasi = await orgService.getByKode(kode)
        if (!organisasi) {
            throw new HttpError(404, "Organisasi tidak ditemukan / sudah tidak aktif.")
        }
        return db.orm.public.jenis_iuran
            .where({ organisasi_id: organisasi.id, isActive: true })
            .all()
    }

    async getJenisIuranByID(id: number) {
        const jenisIuran = await db.orm.public.jenis_iuran.where({ id }).first()
        if (!jenisIuran) {
            throw new HttpError(404, "Jenis iuran tidak ditemukan.")
        }
        return jenisIuran
    }

    async createJenisIuran(input: CreateJenisIuranInput) {
        this.assertTanggalRentangValid(input.tanggal_awal, input.tanggal_akhir)

        const organisasi = await db.orm.public.organisasi
            .where({ id: input.organisasi_id, isActive: true })
            .first()
        if (!organisasi) {
            throw new HttpError(404, "Organisasi tidak ditemukan / sudah tidak aktif.")
        }

        return db.orm.public.jenis_iuran.create(input)
    }

    async updateJenisIuran(id: number, input: UpdateJenisIuranInput) {
        const jenisIuran = await db.orm.public.jenis_iuran.where({ id }).first()
        if (!jenisIuran) {
            throw new HttpError(404, "Jenis iuran tidak ditemukan.")
        }

        const tanggal_awal = input.tanggal_awal ?? jenisIuran.tanggal_awal
        const tanggal_akhir = input.tanggal_akhir ?? jenisIuran.tanggal_akhir
        this.assertTanggalRentangValid(tanggal_awal, tanggal_akhir)

        return db.orm.public.jenis_iuran.where({ id }).update({
            judul: input.judul ?? jenisIuran.judul,
            periode_iuran: input.periode_iuran ?? jenisIuran.periode_iuran,
            nominal: input.nominal ?? jenisIuran.nominal,
            tanggal_awal,
            tanggal_akhir,
            isActive: input.isActive ?? jenisIuran.isActive,
        })
    }

    async deleteJenisIuran(id: number) {
        const jenisIuran = await db.orm.public.jenis_iuran.where({ id }).first()
        if (!jenisIuran) {
            throw new HttpError(404, "Jenis iuran tidak ditemukan.")
        }
        return db.orm.public.jenis_iuran.where({ id }).delete()
    }
}

export const jenisIuranService = new JenisIuranService()
