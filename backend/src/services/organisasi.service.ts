import { db } from "../prisma/db.ts"
import { ConflictError, NotFoundError } from "../utils/http_error.ts"
import type { UserRole } from "../utils/constanta.ts"
import bcrypt from "bcryptjs"

// Role untuk admin organik yang dibuat bersama organisasi.
// Disamakan dengan nilai enum `Role` di Prisma contract.
const ORG_ADMIN_ROLE: UserRole = "ADMIN"

// Biaya hashing seragam di seluruh aplikasi (juga dipakai user.service).
export const BCRYPT_SALT_ROUNDS = 12

export type CreateOrganisasiInput = {
    kode: string
    nama: string
    alamat: string | null
    website: string | null
    isActive: boolean
    activeAt: string | null
    email: string | null
    contact: string | null
}

export type UpdateOrganisasiInput = Partial<
    Pick<
        CreateOrganisasiInput,
        "kode" | "nama" | "alamat" | "website" | "activeAt" | "email" | "contact"
    >
>

type CreateOrganisasiWithUserInput = {
    organisasi: CreateOrganisasiInput
    user: {
        username: string
        name: string
        password: string
        email: string | null
        contact: string | null
    }
}

class OrganisasiService {
    async getByKode(kode: string) {
        const organisasi = await db.orm.public.organisasi
            .where({ kode, isActive: true })
            .first()
        if (!organisasi) {
            throw new NotFoundError("Organisasi tidak ditemukan / sudah tidak aktif.", {
                code: "ORG.NOT_FOUND",
            })
        }
        return organisasi
    }

    async create(input: CreateOrganisasiWithUserInput) {
        // Validasi keunikan sebelum transaksi → pesan spesifik per field.
        await this.assertKodeBebas(input.organisasi.kode)
        await this.assertUsernameBebas(input.user.username)
        await this.assertEmailBebas(input.organisasi.email)
        await this.assertContactBebas(input.organisasi.contact)

        const hashedPassword = await this.hashPassword(input.user.password)

        // Transaksi: organisasi + admin user dibuat atomik. Kembalikan organisasi
        // hasil create agar controller bisa mengirim data ke klien (sebelumnya
        // return undefined → response `data` selalu kosong).
        return db.transaction(async (tx) => {
            const createOrganisasi = await tx.orm.public.organisasi.create(input.organisasi)
            await tx.orm.public.user.create({
                username: input.user.username,
                name: input.user.name,
                password: hashedPassword,
                email: input.user.email,
                contact: input.user.contact,
                organisasi_id: createOrganisasi.id,
                role: ORG_ADMIN_ROLE,
                isActive: true,
            })
            return createOrganisasi
        })
    }

    async updateByKode(kode: string, input: UpdateOrganisasiInput) {
        const existing = await this.assertExisten(kode)

        if (input.kode && input.kode !== kode) {
            await this.assertKodeBebas(input.kode)
        }
        if (input.email && input.email !== existing.email) {
            await this.assertEmailBebas(input.email)
        }
        if (input.contact && input.contact !== existing.contact) {
            await this.assertContactBebas(input.contact)
        }

        return db.orm.public.organisasi.where({ kode }).update(input)
    }

    async deactivateByKode(kode: string) {
        await this.assertExisten(kode)
        return db.orm.public.organisasi.where({ kode }).update({ isActive: false })
    }

    // ---- helpers --------------------------------------------------------

    /** Organisasi harus ada (aktif atau tidak) untuk bisa diubah/dinonaktifkan. */
    private async assertExisten(kode: string) {
        const organisasi = await db.orm.public.organisasi.where({ kode }).first()
        if (!organisasi) {
            throw new NotFoundError("Organisasi tidak ditemukan.", { code: "ORG.NOT_FOUND" })
        }
        return organisasi
    }

    private async assertKodeBebas(kode: string) {
        const taken = await db.orm.public.organisasi.where({ kode }).first()
        if (taken) {
            throw new ConflictError("Kode organisasi sudah ada.", { code: "ORG.KODE_TAKEN" })
        }
    }

    private async assertUsernameBebas(username: string) {
        const taken = await db.orm.public.user.where({ username }).first()
        if (taken) {
            throw new ConflictError("Username sudah digunakan.", { code: "USER.USERNAME_TAKEN" })
        }
    }

    private async assertEmailBebas(email: string | null) {
        if (!email) return
        const taken = await db.orm.public.organisasi.where({ email }).first()
        if (taken) {
            throw new ConflictError("Email organisasi sudah digunakan.", {
                code: "ORG.EMAIL_TAKEN",
            })
        }
    }

    private async assertContactBebas(contact: string | null) {
        if (!contact) return
        const taken = await db.orm.public.organisasi.where({ contact }).first()
        if (taken) {
            throw new ConflictError("Nomor kontak organisasi sudah digunakan.", {
                code: "ORG.CONTACT_TAKEN",
            })
        }
    }

    private async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS)
        return bcrypt.hash(password, salt)
    }
}

export const orgService = new OrganisasiService()
