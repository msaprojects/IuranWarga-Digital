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
    // `detail_peserta` tidak punya kolom `organisasi_id` — tenancy-nya warisan
    // dari `peserta`. Semua method di bawah wajib memverifikasi peserta induk
    // lebih dulu agar id tebakan tidak menembus organisasi lain.
    private async assertPesertaDalamTenant(
        peserta_id: number,
        organisasi_id: number,
        message = "Peserta tidak ditemukan / sudah tidak aktif.",
    ) {
        const peserta = await db.orm.public.peserta
            .where({ id: peserta_id, organisasi_id, isActive: true })
            .first()
        if (!peserta) {
            throw new HttpError(404, message)
        }
        return peserta
    }

    async listByPesertaId(peserta_id: number, organisasi_id: number) {
        await this.assertPesertaDalamTenant(peserta_id, organisasi_id)
        return db.orm.public.detail_peserta.where({ peserta_id, isActive: true }).all()
    }

    async getById(id: number, organisasi_id: number) {
        const row = await db.orm.public.detail_peserta.where({ id, isActive: true }).first()
        if (!row) {
            throw new HttpError(404, "Detail peserta tidak ditemukan.")
        }
        await this.assertPesertaDalamTenant(row.peserta_id, organisasi_id)
        return row
    }

    async create(input: CreateDetailPesertaInput, organisasi_id: number) {
        await this.assertPesertaDalamTenant(input.peserta_id, organisasi_id)

        return db.orm.public.detail_peserta.create({
            peserta_id: input.peserta_id,
            nama: input.nama,
            status_keluarga: input.status_keluarga,
            isActive: input.isActive ?? true,
        })
    }

    async update(id: number, organisasi_id: number, input: UpdateDetailPesertaInput) {
        const existing = await db.orm.public.detail_peserta.where({ id }).first()
        if (!existing) {
            throw new HttpError(404, "Detail peserta tidak ditemukan.")
        }

        // Baris yang diubah harus milik tenant pemanggil.
        await this.assertPesertaDalamTenant(existing.peserta_id, organisasi_id)

        // Kalau anggota keluarga dipindah ke peserta lain, peserta tujuan juga
        // harus berada di tenant yang sama dan masih aktif.
        if (input.peserta_id !== undefined && input.peserta_id !== existing.peserta_id) {
            await this.assertPesertaDalamTenant(
                input.peserta_id,
                organisasi_id,
                "Peserta tujuan tidak ditemukan / sudah tidak aktif.",
            )
        }

        return db.orm.public.detail_peserta.where({ id }).update({
            nama: input.nama ?? existing.nama,
            status_keluarga: input.status_keluarga ?? existing.status_keluarga,
            peserta_id: input.peserta_id ?? existing.peserta_id,
            isActive: input.isActive ?? existing.isActive,
        })
    }

    async delete(id: number, organisasi_id: number) {
        const existing = await db.orm.public.detail_peserta.where({ id }).first()
        if (!existing) {
            throw new HttpError(404, "Detail peserta tidak ditemukan.")
        }
        await this.assertPesertaDalamTenant(existing.peserta_id, organisasi_id)
        return db.orm.public.detail_peserta.where({ id }).delete()
    }
}

export const detailPesertaService = new DetailPesertaService()
