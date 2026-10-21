import { db } from "../prisma/db.ts"
import { HttpError } from "../utils/http_error.ts"
import type { StatusKeluarga } from "../utils/constanta.ts"

export type CreateDetailPesertaInput = {
    peserta_id: number
    nama: string
    status_keluarga: StatusKeluarga
    isActive?: boolean
}

export type UpdateDetailPesertaInput = {
    nama?: string
    status_keluarga?: StatusKeluarga
    peserta_id?: number
    isActive?: boolean
}

class DetailPesertaService {
    async listByPesertaId(peserta_id: number) {
        return db.orm.public.detail_peserta.where({ peserta_id, isActive: true }).all()
    }

    async getById(id: number) {
        const row = await db.orm.public.detail_peserta.where({ id, isActive: true }).first()
        if (!row) {
            throw new HttpError(404, "Detail peserta tidak ditemukan.")
        }
        return row
    }

    async create(input: CreateDetailPesertaInput) {
        const peserta = await db.orm.public.peserta
            .where({ id: input.peserta_id, isActive: true })
            .first()
        if (!peserta) {
            throw new HttpError(404, "Peserta tidak ditemukan / sudah tidak aktif.")
        }

        return db.orm.public.detail_peserta.create({
            peserta_id: input.peserta_id,
            nama: input.nama,
            status_keluarga: input.status_keluarga,
            isActive: input.isActive ?? true,
        })
    }

    async update(id: number, input: UpdateDetailPesertaInput) {
        const existing = await db.orm.public.detail_peserta.where({ id }).first()
        if (!existing) {
            throw new HttpError(404, "Detail peserta tidak ditemukan.")
        }

        // Kalau anggota keluarga dipindah ke peserta lain, pastikan peserta
        // tujuan memang ada dan masih aktif.
        if (input.peserta_id !== undefined && input.peserta_id !== existing.peserta_id) {
            const target = await db.orm.public.peserta
                .where({ id: input.peserta_id, isActive: true })
                .first()
            if (!target) {
                throw new HttpError(404, "Peserta tujuan tidak ditemukan / sudah tidak aktif.")
            }
        }

        return db.orm.public.detail_peserta.where({ id }).update({
            nama: input.nama ?? existing.nama,
            status_keluarga: input.status_keluarga ?? existing.status_keluarga,
            peserta_id: input.peserta_id ?? existing.peserta_id,
            isActive: input.isActive ?? existing.isActive,
        })
    }

    async delete(id: number) {
        const existing = await db.orm.public.detail_peserta.where({ id }).first()
        if (!existing) {
            throw new HttpError(404, "Detail peserta tidak ditemukan.")
        }
        return db.orm.public.detail_peserta.where({ id }).delete()
    }
}

export const detailPesertaService = new DetailPesertaService()
