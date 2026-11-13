import { db } from "../prisma/db.ts"
import { ConflictError, NotFoundError } from "../utils/http_error.ts"
import { subOrganisasiService } from "./sub_organisasi.service.ts"
import dayjs from "../utils/dayjs.ts"

export type CreateAnggotaSubOrganisasiInput = {
    peserta_id: number
    isActive?: boolean
}

export type UpdateAnggotaSubOrganisasiInput = {
    isActive: boolean
}

/**
 * Keanggotaan peserta pada sub-organisasi.
 *
 * Tabel ini tidak punya kolom `organisasi_id`, jadi tenancy-nya warisan dari
 * sub-organisasi induk: setiap operasi wajib memverifikasi induk lebih dulu.
 */
class AnggotaSubOrganisasiService {
    async list(sub_organisasi_id: number, organisasi_id: number) {
        await subOrganisasiService.assertSubOrganisasiDalamTenant(
            sub_organisasi_id,
            organisasi_id,
        )
        return db.orm.public.anggota_sub_organisasi.where({ sub_organisasi_id }).all()
    }

    async create(
        sub_organisasi_id: number,
        organisasi_id: number,
        input: CreateAnggotaSubOrganisasiInput,
    ) {
        await subOrganisasiService.assertSubOrganisasiDalamTenant(
            sub_organisasi_id,
            organisasi_id,
        )
        // Peserta dari organisasi lain tidak boleh didaftarkan, walau id-nya
        // valid secara global.
        await this.assertPesertaDalamTenant(input.peserta_id, organisasi_id)
        await this.assertBelumTerdaftar(sub_organisasi_id, input.peserta_id)

        return db.orm.public.anggota_sub_organisasi.create({
            sub_organisasi_id,
            peserta_id: input.peserta_id,
            isActive: input.isActive ?? true,
        })
    }

    async update(
        id: number,
        organisasi_id: number,
        input: UpdateAnggotaSubOrganisasiInput,
    ) {
        const existing = await this.assertEksis(id)
        await subOrganisasiService.assertSubOrganisasiDalamTenant(
            existing.sub_organisasi_id,
            organisasi_id,
        )

        return db.orm.public.anggota_sub_organisasi.where({ id }).update({
            isActive: input.isActive,
            updatedAt: dayjs().toISOString(),
        })
    }

    /**
     * Hapus permanen, bukan `isActive: false`.
     *
     * `@@unique([sub_organisasi_id, peserta_id])` berlaku untuk semua baris,
     * sehingga baris yang hanya dinonaktifkan akan menolak peserta yang sama
     * didaftarkan ulang. Baris ini murni penghubung dan tidak dirujuk tabel
     * lain, jadi aman dihapus — gunakan PATCH bila ingin menyimpan riwayat.
     */
    async delete(id: number, organisasi_id: number) {
        const existing = await this.assertEksis(id)
        await subOrganisasiService.assertSubOrganisasiDalamTenant(
            existing.sub_organisasi_id,
            organisasi_id,
        )

        return db.orm.public.anggota_sub_organisasi.where({ id }).delete()
    }

    // ---- helpers --------------------------------------------------------

    private async assertEksis(id: number) {
        const anggota = await db.orm.public.anggota_sub_organisasi.where({ id }).first()
        if (!anggota) {
            throw new NotFoundError("Anggota sub organisasi tidak ditemukan.", {
                code: "SUB_ANGGOTA.NOT_FOUND",
            })
        }
        return anggota
    }

    private async assertPesertaDalamTenant(peserta_id: number, organisasi_id: number) {
        const peserta = await db.orm.public.peserta
            .where({ id: peserta_id, organisasi_id, isActive: true })
            .first()
        if (!peserta) {
            throw new NotFoundError("Peserta tidak ditemukan / sudah tidak aktif.", {
                code: "PESERTA.NOT_FOUND",
            })
        }
        return peserta
    }

    private async assertBelumTerdaftar(sub_organisasi_id: number, peserta_id: number) {
        const terdaftar = await db.orm.public.anggota_sub_organisasi
            .where({ sub_organisasi_id, peserta_id })
            .first()
        if (terdaftar) {
            throw new ConflictError(
                "Peserta sudah terdaftar pada sub organisasi ini. Aktifkan kembali lewat PATCH bila sebelumnya dinonaktifkan.",
                { code: "SUB_ANGGOTA.SUDAH_TERDAFTAR" },
            )
        }
    }
}

export const anggotaSubOrganisasiService = new AnggotaSubOrganisasiService()
