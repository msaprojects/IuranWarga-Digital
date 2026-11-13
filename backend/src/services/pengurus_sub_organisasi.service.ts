import { db } from "../prisma/db.ts"
import { ConflictError, NotFoundError } from "../utils/http_error.ts"
import { subOrganisasiService } from "./sub_organisasi.service.ts"
import dayjs from "../utils/dayjs.ts"

export type CreatePengurusSubOrganisasiInput = {
    user_id: number
    jabatan: string
    isActive?: boolean
}

export type UpdatePengurusSubOrganisasiInput = {
    jabatan?: string
    isActive?: boolean
}

/**
 * Pengurus (panitia) sub-organisasi: user + jabatan.
 *
 * Ketua/penanggung jawab sengaja tidak disimpan di `sub_organisasi` — satu
 * sumber kebenaran ada di sini lewat kolom `jabatan`.
 *
 * Tabel ini tidak punya kolom `organisasi_id`, jadi tenancy-nya warisan dari
 * sub-organisasi induk.
 */
class PengurusSubOrganisasiService {
    async list(sub_organisasi_id: number, organisasi_id: number) {
        await subOrganisasiService.assertSubOrganisasiDalamTenant(sub_organisasi_id, organisasi_id)
        return db.orm.public.pengurus_sub_organisasi.where({ sub_organisasi_id }).all()
    }

    async create(
        sub_organisasi_id: number,
        organisasi_id: number,
        input: CreatePengurusSubOrganisasiInput,
    ) {
        await subOrganisasiService.assertSubOrganisasiDalamTenant(sub_organisasi_id, organisasi_id)
        await this.assertUserDalamTenant(input.user_id, organisasi_id)
        await this.assertBelumTerdaftar(sub_organisasi_id, input.user_id)

        return db.orm.public.pengurus_sub_organisasi.create({
            sub_organisasi_id,
            user_id: input.user_id,
            jabatan: input.jabatan,
            isActive: input.isActive ?? true,
        })
    }

    async update(id: number, organisasi_id: number, input: UpdatePengurusSubOrganisasiInput) {
        const existing = await this.assertEksis(id)
        await subOrganisasiService.assertSubOrganisasiDalamTenant(
            existing.sub_organisasi_id,
            organisasi_id,
        )

        return db.orm.public.pengurus_sub_organisasi.where({ id }).update({
            jabatan: input.jabatan ?? existing.jabatan,
            isActive: input.isActive ?? existing.isActive,
            updatedAt: dayjs().toISOString(),
        })
    }

    /**
     * Hapus permanen. `@@unique([sub_organisasi_id, user_id])` berlaku untuk
     * semua baris, jadi baris yang hanya dinonaktifkan akan menolak user yang
     * sama diangkat ulang. Penonaktifan sementara tersedia lewat PATCH.
     */
    async delete(id: number, organisasi_id: number) {
        const existing = await this.assertEksis(id)
        await subOrganisasiService.assertSubOrganisasiDalamTenant(
            existing.sub_organisasi_id,
            organisasi_id,
        )

        return db.orm.public.pengurus_sub_organisasi.where({ id }).delete()
    }

    // ---- helpers --------------------------------------------------------

    private async assertEksis(id: number) {
        const pengurus = await db.orm.public.pengurus_sub_organisasi.where({ id }).first()
        if (!pengurus) {
            throw new NotFoundError("Pengurus sub organisasi tidak ditemukan.", {
                code: "SUB_PANITIA.NOT_FOUND",
            })
        }
        return pengurus
    }

    /**
     * User harus aktif DAN terikat ke organisasi pemanggil.
     * `user.organisasi_id` nullable (mis. super admin lintas organisasi), dan
     * user tanpa organisasi memang tidak boleh diangkat menjadi pengurus.
     */
    private async assertUserDalamTenant(user_id: number, organisasi_id: number) {
        const user = await db.orm.public.user
            .where({ id: user_id, organisasi_id, isActive: true })
            .first()
        if (!user) {
            throw new NotFoundError("User tidak ditemukan / tidak aktif di organisasi ini.", {
                code: "USER.NOT_FOUND",
            })
        }
        return user
    }

    private async assertBelumTerdaftar(sub_organisasi_id: number, user_id: number) {
        const terdaftar = await db.orm.public.pengurus_sub_organisasi
            .where({ sub_organisasi_id, user_id })
            .first()
        if (terdaftar) {
            throw new ConflictError(
                "User sudah terdaftar sebagai pengurus sub organisasi ini. Ubah jabatan lewat PATCH bila perlu.",
                { code: "SUB_PANITIA.SUDAH_TERDAFTAR" },
            )
        }
    }
}

export const pengurusSubOrganisasiService = new PengurusSubOrganisasiService()
