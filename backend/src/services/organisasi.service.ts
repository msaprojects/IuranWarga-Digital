import { db } from "../prisma/db.ts"
import { HttpError } from "../utils/http_error.ts"
import bcrypt from "bcryptjs"

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
    Pick<CreateOrganisasiInput, "kode" | "nama" | "alamat" | "website" | "activeAt">
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
        return db.orm.public.organisasi.where({ kode, isActive: true }).first()
    }

    async create(input: CreateOrganisasiWithUserInput) {
        // return db.orm.public.organisasi.create(input);

        // ketika kode organisasi sudah ada, maka throw error
        const existingOrganisasi = await db.orm.public.organisasi
            .where({ kode: input.organisasi.kode })
            .first()
        if (existingOrganisasi) {
            throw new HttpError(409, "Kode organisasi sudah ada.")
        }
        const existingUser = await db.orm.public.user
            .where({ username: input.user.username })
            .first()
        if (existingUser) {
            throw new HttpError(409, "Username sudah digunakan.")
        }
        if (
            input.organisasi.email &&
            (await db.orm.public.organisasi.where({ email: input.organisasi.email }).first())
        ) {
            throw new HttpError(409, "Email organisasi sudah digunakan.")
        }
        if (
            input.organisasi.contact &&
            (await db.orm.public.organisasi.where({ contact: input.organisasi.contact }).first())
        ) {
            throw new HttpError(409, "Nomor kontak organisasi sudah digunakan.")
        }

        return db.transaction(async (tx) => {
            // create organisasi and user too!
            const createOrganisasi = await tx.orm.public.organisasi.create(input.organisasi)
            const salt = await bcrypt.genSalt(12)
            const hashedPassword = await bcrypt.hash(input.user.password, salt)

            await tx.orm.public.user.create({
                username: input.user.username,
                name: input.user.name,
                password: hashedPassword,
                organisasi_id: createOrganisasi.id,
                role: "ADMIN",
                isActive: true,
            })
        })
    }

    async updateByKode(kode: string, input: UpdateOrganisasiInput) {
        if (input.kode && input.kode !== kode) {
            const existingOrganisasi = await db.orm.public.organisasi
                .where({ kode: input.kode })
                .first()
            if (existingOrganisasi) {
                throw new HttpError(409, "Kode organisasi sudah ada.")
            }
        }

        return db.orm.public.organisasi.where({ kode, isActive: true }).update(input)
    }

    async deactivateByKode(kode: string) {
        return db.orm.public.organisasi.where({ kode, isActive: true }).update({ isActive: false })
    }
}

export const orgService = new OrganisasiService()
