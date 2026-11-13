import { db } from "../prisma/db.ts"
import { ConflictError, NotFoundError } from "../utils/http_error.ts"
import { subOrganisasiService } from "./sub_organisasi.service.ts"
import dayjs from "../utils/dayjs.ts"

export type CreateKomponenSubOrganisasiInput = {
    jenis_iuran_id: number
    nominal: string
    isActive?: boolean
}

export type UpdateKomponenSubOrganisasiInput = {
    nominal?: string
    isActive?: boolean
}

/**
 * Override tarif `jenis_iuran` khusus satu sub-organisasi.
 *
 * Baris di sini BUKAN salinan `jenis_iuran.nominal`; simpan hanya bila tarif
 * sub-organisasi memang berbeda dari tarif induk.
 *
 * Tabel ini tidak punya kolom `organisasi_id`, jadi tenancy-nya warisan dari
 * sub-organisasi induk.
 */
class KomponenSubOrganisasiService {
    async list(sub_organisasi_id: number, organisasi_id: number) {
        await subOrganisasiService.assertSubOrganisasiDalamTenant(
            sub_organisasi_id,
            organisasi_id,
        )
        return db.orm.public.komponen_sub_organisasi.where({ sub_organisasi_id }).all()
    }

    async create(
        sub_organisasi_id: number,
        organisasi_id: number,
        input: CreateKomponenSubOrganisasiInput,
    ) {
        await subOrganisasiService.assertSubOrganisasiDalamTenant(
            sub_organisasi_id,
            organisasi_id,
        )
        // Jenis iuran milik organisasi lain tetap valid secara global, jadi
        // scope tenant + isActive wajib dicek seperti pada `tagihan_iuran`.
        await this.assertJenisIuranDalamTenant(input.jenis_iuran_id, organisasi_id)
        await this.assertBelumDikonfigurasi(sub_organisasi_id, input.jenis_iuran_id)

        return db.orm.public.komponen_sub_organisasi.create({
            sub_organisasi_id,
            jenis_iuran_id: input.jenis_iuran_id,
            nominal: input.nominal,
            isActive: input.isActive ?? true,
        })
    }

    async update(
        id: number,
        organisasi_id: number,
        input: UpdateKomponenSubOrganisasiInput,
    ) {
        const existing = await this.assertEksis(id)
        await subOrganisasiService.assertSubOrganisasiDalamTenant(
            existing.sub_organisasi_id,
            organisasi_id,
        )

        return db.orm.public.komponen_sub_organisasi.where({ id }).update({
            nominal: input.nominal ?? existing.nominal,
            isActive: input.isActive ?? existing.isActive,
            updatedAt: dayjs().toISOString(),
        })
    }

    /**
     * Hapus permanen. `@@unique([sub_organisasi_id, jenis_iuran_id])` berlaku
     * untuk semua baris, jadi baris yang hanya dinonaktifkan akan menolak jenis
     * iuran yang sama dikonfigurasi ulang. Penonaktifan tarif tersedia lewat
     * PATCH (`isActive: false`) bila override ingin dihentikan tanpa dihapus.
     */
    async delete(id: number, organisasi_id: number) {
        const existing = await this.assertEksis(id)
        await subOrganisasiService.assertSubOrganisasiDalamTenant(
            existing.sub_organisasi_id,
            organisasi_id,
        )

        return db.orm.public.komponen_sub_organisasi.where({ id }).delete()
    }

    // ---- helpers --------------------------------------------------------

    private async assertEksis(id: number) {
        const komponen = await db.orm.public.komponen_sub_organisasi.where({ id }).first()
        if (!komponen) {
            throw new NotFoundError("Komponen sub organisasi tidak ditemukan.", {
                code: "SUB_KOMPONEN.NOT_FOUND",
            })
        }
        return komponen
    }

    private async assertJenisIuranDalamTenant(jenis_iuran_id: number, organisasi_id: number) {
        const jenisIuran = await db.orm.public.jenis_iuran
            .where({ id: jenis_iuran_id, organisasi_id, isActive: true })
            .first()
        if (!jenisIuran) {
            throw new NotFoundError("Jenis Iuran Tidak Ditemukan", {
                code: "JENIS_IURAN.NOT_FOUND",
            })
        }
        return jenisIuran
    }

    private async assertBelumDikonfigurasi(sub_organisasi_id: number, jenis_iuran_id: number) {
        const terkonfigurasi = await db.orm.public.komponen_sub_organisasi
            .where({ sub_organisasi_id, jenis_iuran_id })
            .first()
        if (terkonfigurasi) {
            throw new ConflictError(
                "Jenis iuran sudah dikonfigurasi untuk sub organisasi ini. Perbarui nominal lewat PATCH.",
                { code: "SUB_KOMPONEN.SUDAH_DIKONFIGURASI" },
            )
        }
    }
}

export const komponenSubOrganisasiService = new KomponenSubOrganisasiService()
