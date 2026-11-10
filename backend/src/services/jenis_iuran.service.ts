import { db } from "../prisma/db.ts"
import { HttpError } from "../utils/http_error.ts"
import { orgService } from "./organisasi.service.ts"
import type { JenisPeserta, PeriodeIuran } from "../utils/constanta.ts"

export type CreateJenisIuranInput = {
    judul: string
    periode_iuran: PeriodeIuran
    // Tipe peserta yang dikenai tarif ini (wajib di contract, tanpa default).
    jenis_peserta: JenisPeserta
    nominal: string
    organisasi_id: number
    isActive?: boolean
}

export type UpdateJenisIuranInput = Partial<
    Pick<
        CreateJenisIuranInput,
        "judul" | "periode_iuran" | "jenis_peserta" | "nominal" | "isActive"
    >
>

class JenisIuranService {

    async getJenisIuranByKodeOrganisasi(kode: string) {
        const organisasi = await orgService.getByKode(kode)
        if (!organisasi) {
            throw new HttpError(404, "Organisasi tidak ditemukan / sudah tidak aktif.")
        }
        return db.orm.public.jenis_iuran
            .where({ organisasi_id: organisasi.id, isActive: true })
            .all()
    }

    async getJenisIuranByID(id: number, organisasi_id: number) {
        // Lookup global akan membocorkan jenis iuran organisasi lain, jadi
        // scope wajib memuat `organisasi_id` dari tenant token.
        const jenisIuran = await db.orm.public.jenis_iuran.where({ id, organisasi_id }).first()
        if (!jenisIuran) {
            throw new HttpError(404, "Jenis iuran tidak ditemukan.")
        }
        return jenisIuran
    }

    async createJenisIuran(input: CreateJenisIuranInput) {
        const organisasi = await db.orm.public.organisasi
            .where({ id: input.organisasi_id, isActive: true })
            .first()
        if (!organisasi) {
            throw new HttpError(404, "Organisasi tidak ditemukan / sudah tidak aktif.")
        }

        return db.orm.public.jenis_iuran.create(input)
    }

    async updateJenisIuran(id: number, organisasi_id: number, input: UpdateJenisIuranInput) {
        const scope = { id, organisasi_id }
        const jenisIuran = await db.orm.public.jenis_iuran.where(scope).first()
        if (!jenisIuran) {
            throw new HttpError(404, "Jenis iuran tidak ditemukan.")
        }


        return db.orm.public.jenis_iuran.where(scope).update({
            judul: input.judul ?? jenisIuran.judul,
            periode_iuran: input.periode_iuran ?? jenisIuran.periode_iuran,
            jenis_peserta: input.jenis_peserta ?? jenisIuran.jenis_peserta,
            nominal: input.nominal ?? jenisIuran.nominal,
            isActive: input.isActive ?? jenisIuran.isActive,
        })
    }

    async deleteJenisIuran(id: number, organisasi_id: number) {
        const scope = { id, organisasi_id }
        const jenisIuran = await db.orm.public.jenis_iuran.where(scope).first()
        if (!jenisIuran) {
            throw new HttpError(404, "Jenis iuran tidak ditemukan.")
        }
        return db.orm.public.jenis_iuran.where(scope).delete()
    }
}

export const jenisIuranService = new JenisIuranService()
