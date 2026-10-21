import { generateJWT } from "../utils/jwtutils.ts"
import { db } from "../prisma/db.ts"
import { ConflictError, NotFoundError, UnauthorizedError } from "../utils/http_error.ts"
import { BCRYPT_SALT_ROUNDS } from "./organisasi.service.ts"
import type { UserRole } from "../utils/constanta.ts"

export type CreateUserInput = {
    username: string
    name: string
    password: string
    role: UserRole
    organisasi_id: number
    isActive?: boolean
    email: string | null
    contact: string | null
}

export type UpdateUserInput = Partial<
    Pick<
        CreateUserInput,
        | "username"
        | "name"
        | "password"
        | "role"
        | "organisasi_id"
        | "email"
        | "contact"
        | "isActive"
    >
>

// Kolom yang di return
const USER_PUBLIC_SELECT = [
    "id",
    "username",
    "name",
    "role",
    "organisasi_id",
    "latestLogin",
    "isActive",
    "email",
    "contact",
] as const

/**
 * Drop kolom sensitif (password hash)
 */
function tanpaPassword<T extends { password: unknown }>(row: T): Omit<T, "password"> {
    const { password: _ignored, ...safe } = row
    return safe
}

class UserService {
    // Check Organisasi dan kembalikan id organisasi.
    private async assertOrganisasiAktifByKode(organizationCode: string) {
        const organization = await db.orm.public.organisasi
            .where({ kode: organizationCode, isActive: true })
            .select("id")
            .first()
        if (!organization) {
            throw new NotFoundError("Organisasi tidak ditemukan / sudah tidak aktif.", {
                code: "ORG.NOT_FOUND",
            })
        }
        return organization.id
    }

    private async assertOrganisasiAktifById(organisasi_id: number) {
        const organization = await db.orm.public.organisasi
            .where({ id: organisasi_id, isActive: true })
            .select("id")
            .first()
        if (!organization) {
            throw new NotFoundError("Organisasi tidak ditemukan atau tidak aktif.", {
                code: "ORG.NOT_FOUND",
            })
        }
        return organization
    }

    /**
     * Bedakan "klien mengirim nilai" (termasuk `null`) vs "klien tidak mengirim field".
     * Hanya `undefined` yang jatuh ke nilai lama.
     */
    private pick<T>(incoming: T | undefined, fallback: T): T {
        return incoming !== undefined ? incoming : fallback
    }

    private async hashPassword(password: string): Promise<string> {
        return await Bun.password.hash(password.repeat(3), {
            algorithm: "bcrypt",
            cost: BCRYPT_SALT_ROUNDS,
        })
    }

    /**
     * Detail user berdasarkan ID + kode organisasi.
     * Kode organisasi ikut divalidasi agar user dipastikan berada di organisasi
     * yang sama (lapisan validasi multi-tenant).
     */
    async getUserByIdAndOrganizationCode(id: number, organizationCode: string) {
        const organizationId = await this.assertOrganisasiAktifByKode(organizationCode)

        const user = await db.orm.public.user
            .where({ id, organisasi_id: organizationId, isActive: true })
            .select(...USER_PUBLIC_SELECT)
            .first()
        if (!user) {
            throw new NotFoundError("User tidak ditemukan / sudah tidak aktif.", {
                code: "USER.NOT_FOUND",
            })
        }
        return user
    }

    async getUsersByOrganizationCode(organizationCode: string) {
        const organizationId = await this.assertOrganisasiAktifByKode(organizationCode)

        return db.orm.public.user
            .where({ organisasi_id: organizationId, isActive: true })
            .select("id", "username", "name", "role", "organisasi_id", "latestLogin")
            .all()
    }

    async createUser(input: CreateUserInput) {
        const organization = await this.assertOrganisasiAktifById(input.organisasi_id)

        await this.assertUsernameBebas(input.username)
        await this.assertEmailBebas(input.email)
        await this.assertContactBebas(input.contact)

        const hashedPassword = await this.hashPassword(input.password)

        const created = await db.orm.public.user.create({
            username: input.username,
            name: input.name,
            password: hashedPassword,
            role: input.role,
            organisasi_id: organization.id,
            isActive: input.isActive ?? true,
            email: input.email,
            contact: input.contact,
        })
        return tanpaPassword(created)
    }

    async updateUser(id: number, input: UpdateUserInput) {
        const user = await db.orm.public.user.where({ id }).first()
        if (!user) {
            throw new NotFoundError("User tidak ditemukan.", { code: "USER.NOT_FOUND" })
        }

        if (input.username && input.username !== user.username) {
            await this.assertUsernameBebas(input.username)
        }
        if (input.email && input.email !== user.email) {
            await this.assertEmailBebas(input.email)
        }
        if (input.contact && input.contact !== user.contact) {
            await this.assertContactBebas(input.contact)
        }
        // Pindah organisasi → pastikan tujuan valid & aktif (cegah lintas-tenant).
        if (input.organisasi_id !== undefined && input.organisasi_id !== user.organisasi_id) {
            await this.assertOrganisasiAktifById(input.organisasi_id)
        }

        const hashedPassword = input.password
            ? await this.hashPassword(input.password)
            : user.password

        const updated = await db.orm.public.user.where({ id }).update({
            username: this.pick(input.username, user.username),
            name: this.pick(input.name, user.name),
            password: hashedPassword,
            role: this.pick(input.role, user.role),
            organisasi_id: this.pick(input.organisasi_id, user.organisasi_id),
            isActive: this.pick(input.isActive, user.isActive),
            email: this.pick(input.email, user.email),
            contact: this.pick(input.contact, user.contact),
        })
        if (!updated) {
            // Race: row hilang antara cek-existence dan update.
            throw new NotFoundError("User tidak ditemukan.", { code: "USER.NOT_FOUND" })
        }
        return tanpaPassword(updated)
    }

    async loginUser(username: string, password: string) {
        const user = await db.orm.public.user.where({ username }).first()
        // Satu pesan untuk user-tak-ada & salah-password (cegah user enumeration).
        if (!user) {
            throw new UnauthorizedError("Username atau password salah.", {
                code: "AUTH.INVALID_CREDENTIALS",
            })
        }

        const organization = await db.orm.public.organisasi
            .where({ id: user.organisasi_id, isActive: true })
            .select("id", "kode")
            .first()
        if (!organization) {
            throw new UnauthorizedError("Organisasi anda tidak ditemukan atau sudah tidak aktif.", {
                code: "ORG.INACTIVE",
            })
        }

        const isPasswordValid = await Bun.password.verify(password, user.password)
        if (!isPasswordValid) {
            throw new UnauthorizedError("Username atau password salah.", {
                code: "AUTH.INVALID_CREDENTIALS",
            })
        }

        // User nonaktif tidak boleh login meski kredensial benar.
        if (!user.isActive) {
            throw new UnauthorizedError("Akun anda sudah dinonaktifkan.", {
                code: "AUTH.ACCOUNT_INACTIVE",
            })
        }

        const token = generateJWT(user.id, organization.kode, organization.id, user.username)

        await db.orm.public.user
            .where({ id: user.id })
            .update({ latestLogin: new Date().toISOString() })

        return {
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                kode_organisasi: organization.kode,
            },
            token,
        }
    }

    // ---- helpers keunikan ------------------------------------------------

    private async assertUsernameBebas(username: string) {
        const taken = await db.orm.public.user.where({ username }).first()
        if (taken) {
            throw new ConflictError("Username sudah digunakan.", { code: "USER.USERNAME_TAKEN" })
        }
    }

    private async assertEmailBebas(email: string | null) {
        if (!email) return
        const taken = await db.orm.public.user.where({ email }).first()
        if (taken) {
            throw new ConflictError("Email sudah digunakan.", { code: "USER.EMAIL_TAKEN" })
        }
    }

    private async assertContactBebas(contact: string | null) {
        if (!contact) return
        const taken = await db.orm.public.user.where({ contact }).first()
        if (taken) {
            throw new ConflictError("Nomor kontak sudah digunakan.", { code: "USER.CONTACT_TAKEN" })
        }
    }
}

export const userService = new UserService()
