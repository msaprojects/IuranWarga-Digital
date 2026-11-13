import { db } from "../prisma/db.ts"
import { ConflictError, NotFoundError } from "../utils/http_error.ts"
import dayjs from "../utils/dayjs.ts"

export type CreateSubOrganisasiInput = {
    nama: string
    deskripsi?: string | null
    pisah_laporan?: boolean
    isActive?: boolean
}

export type UpdateSubOrganisasiInput = {
    nama?: string
    deskripsi?: string | null
    pisah_laporan?: boolean
    isActive?: boolean
}

class SubOrganisasiService {
    /**
     * Sub-organisasi harus ADA dan AKTIF di dalam tenant pemanggil.
     *
     * Dipakai juga oleh service anak (`anggota_sub_organisasi`,
     * `pengurus_sub_organisasi`, `komponen_sub_organisasi`) yang tidak punya
     * kolom `organisasi_id`: tenancy mereka warisan dari sub-organisasi induk,
     * jadi tanpa pemeriksaan ini id tebakan bisa menembus organisasi lain.
     */
    async assertSubOrganisasiDalamTenant(
        sub_organisasi_id: number,
        organisasi_id: number,
        message = "Sub organisasi tidak ditemukan / sudah tidak aktif.",
    ) {
        const subOrganisasi = await db.orm.public.sub_organisasi
            .where({ id: sub_organisasi_id, organisasi_id, isActive: true })
            .first()
        if (!subOrganisasi) {
            throw new NotFoundError(message, { code: "SUB_ORGANISASI.NOT_FOUND" })
        }
        return subOrganisasi
    }

    /**
     * Semua sub-organisasi milik tenant — TERMASUK yang nonaktif.
     * Endpoint ini dipakai layar pengaturan: menyembunyikan baris nonaktif akan
     * membuat data itu tidak bisa ditemukan lagi untuk diaktifkan kembali.
     */
    async getAll(organisasi_id: number) {
        return db.orm.public.sub_organisasi.where({ organisasi_id }).all()
    }

    async getById(id: number, organisasi_id: number) {
        return this.assertEksis(id, organisasi_id)
    }

    async create(input: CreateSubOrganisasiInput, organisasi_id: number) {
        // `@@unique([organisasi_id, nama])` dijaga lebih dulu agar pesannya
        // spesifik; constraint DB tetap menjadi pengaman terakhir.
        await this.assertNamaBebas(input.nama, organisasi_id)

        return db.orm.public.sub_organisasi.create({
            organisasi_id,
            nama: input.nama,
            deskripsi: input.deskripsi ?? null,
            pisah_laporan: input.pisah_laporan ?? false,
            isActive: input.isActive ?? true,
        })
    }

    async update(id: number, organisasi_id: number, input: UpdateSubOrganisasiInput) {
        const existing = await this.assertEksis(id, organisasi_id)

        if (input.nama !== undefined && input.nama !== existing.nama) {
            await this.assertNamaBebas(input.nama, organisasi_id)
        }

        return db.orm.public.sub_organisasi.where({ id, organisasi_id }).update({
            nama: input.nama ?? existing.nama,
            // Pakai perbandingan `undefined`, bukan `??`, agar deskripsi bisa
            // dikosongkan (null) — `??` akan mempertahankan nilai lama.
            deskripsi: input.deskripsi === undefined ? existing.deskripsi : input.deskripsi,
            pisah_laporan: input.pisah_laporan ?? existing.pisah_laporan,
            isActive: input.isActive ?? existing.isActive,
            updatedAt: dayjs().toISOString(),
        })
    }

    /**
     * Soft delete: baris tidak dihapus karena bisa sudah direferensikan
     * `tagihan_iuran` / `transaction_ledger`. Nonaktifkan agar tetap konsisten
     * secara historis, lalu aktifkan lagi lewat PATCH bila perlu.
     */
    async deactivate(id: number, organisasi_id: number) {
        await this.assertEksis(id, organisasi_id)

        return db.orm.public.sub_organisasi.where({ id, organisasi_id }).update({
            isActive: false,
            updatedAt: dayjs().toISOString(),
        })
    }

    // ---- helpers --------------------------------------------------------

    /**
     * Baris milik tenant tanpa syarat aktif — dipakai get/update/deactivate
     * supaya sub-organisasi yang sudah nonaktif masih bisa dibaca & diaktifkan.
     */
    private async assertEksis(id: number, organisasi_id: number) {
        const subOrganisasi = await db.orm.public.sub_organisasi
            .where({ id, organisasi_id })
            .first()
        if (!subOrganisasi) {
            throw new NotFoundError("Sub organisasi tidak ditemukan.", {
                code: "SUB_ORGANISASI.NOT_FOUND",
            })
        }
        return subOrganisasi
    }

    private async assertNamaBebas(nama: string, organisasi_id: number) {
        // Dicek tanpa filter `isActive`: constraint unik berlaku untuk semua
        // baris, sehingga nama milik sub-organisasi nonaktif tetap terpakai.
        const taken = await db.orm.public.sub_organisasi.where({ organisasi_id, nama }).first()
        if (taken) {
            throw new ConflictError(
                "Nama sub organisasi sudah dipakai (termasuk sub organisasi nonaktif).",
                { code: "SUB_ORGANISASI.NAMA_TAKEN" },
            )
        }
    }
}

export const subOrganisasiService = new SubOrganisasiService()
