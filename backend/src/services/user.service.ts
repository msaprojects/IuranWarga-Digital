import { generateJWT } from "./../utils/jwtutils"
import bcrypt, { genSalt } from "bcryptjs"
import { db } from "../prisma/db.ts"
import { HttpError } from "../utils/http_error.ts"

export type CreateUserInput = {
    username: string
    name: string
    password: string
    role: "USER" | "ADMIN" | "SUPER_ADMIN"
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

class UserService {
    private async getActiveOrganizationId(organizationCode: string) {
        const organization = await db.orm.public.organisasi
            .where({ kode: organizationCode, isActive: true })
            .select("id")
            .first()

        return organization?.id ?? null
    }

    /**
     * Mengambil data detail user berdasarkan ID dan Kode Organisasi.
     * alasan : Kenapa tidak ID saja? karena untuk memastikan user tersebut
     *          memang berada di organisasi yang sama dengan kode organisasi yang diberikan,
     *          sehingga menambah lapisan keamanan dan validasi.
     */
    async getUserByIdAndOrganizationCode(id: number, organizationCode: string) {
        const organizationId = await this.getActiveOrganizationId(organizationCode)
        if (organizationId === null) {
            return null
        }

        return db.orm.public.user
            .where({ id, organisasi_id: organizationId })
            .select(
                "id",
                "username",
                "name",
                "role",
                "organisasi_id",
                "latestLogin",
                "isActive",
                "email",
                "contact",
            )
            .first()
    }

    async getUsersByOrganizationCode(organizationCode: string) {
        const organizationId = await this.getActiveOrganizationId(organizationCode)
        if (organizationId === null) {
            return []
        }

        return db.orm.public.user
            .where({ organisasi_id: organizationId })
            .select("id", "username", "name", "role", "organisasi_id", "latestLogin")
            .all()
    }

    async createUser(input: CreateUserInput) {
        const organization = await db.orm.public.organisasi
            .where({ id: input.organisasi_id, isActive: true })
            .select("id")
            .first()
        if (!organization) {
            throw new HttpError(404, "Organisasi tidak ditemukan atau tidak aktif.")
        }

        const existingUser = await db.orm.public.user.where({ username: input.username }).first()
        if (existingUser) {
            throw new HttpError(409, "Username sudah digunakan.")
        }
        if (input.email && (await db.orm.public.user.where({ email: input.email }).first())) {
            throw new HttpError(409, "Email sudah digunakan.")
        }
        if (input.contact && (await db.orm.public.user.where({ contact: input.contact }).first())) {
            throw new HttpError(409, "Nomor kontak sudah digunakan.")
        }

        const salt = await bcrypt.genSalt(12)
        const hashedPassword = await bcrypt.hash(input.password, salt)

        return db.orm.public.user.create({
            username: input.username,
            name: input.name,
            password: hashedPassword,
            role: input.role,
            organisasi_id: organization.id,
            isActive: input.isActive ?? true,
            email: input.email,
            contact: input.contact,
        })
    }

    async updateUser(id: number, input: UpdateUserInput) {
        const user = await db.orm.public.user.where({ id }).first()
        if (!user) {
            throw new HttpError(404, "User tidak ditemukan.")
        }

        if (input.username && input.username !== user.username) {
            const existingUser = await db.orm.public.user
                .where({ username: input.username })
                .first()
            if (existingUser) {
                throw new HttpError(409, "Username sudah digunakan.")
            }
        }
        if (input.email && input.email !== user.email) {
            const existingUser = await db.orm.public.user.where({ email: input.email }).first()
            if (existingUser) {
                throw new HttpError(409, "Email sudah digunakan.")
            }
        }
        if (input.contact && input.contact !== user.contact) {
            const existingUser = await db.orm.public.user.where({ contact: input.contact }).first()
            if (existingUser) {
                throw new HttpError(409, "Nomor kontak sudah digunakan.")
            }
        }

        // Hash the password if it is provided in the input
        if (input.password) {
            const salt = await bcrypt.genSalt(12)
            const hashedPassword = await bcrypt.hash(input.password, salt)
            input.password = hashedPassword
        }

        return db.orm.public.user.where({ id }).update({
            username: input.username ?? user.username,
            name: input.name ?? user.name,
            password: input.password ?? user.password,
            role: input.role ?? user.role,
            organisasi_id: input.organisasi_id ?? user.organisasi_id,
            isActive: input.isActive ?? user.isActive,
            email: input.email ?? user.email,
            contact: input.contact ?? user.contact,
        })
    }

    async loginUser(username: string, password: string) {
        const user = await db.orm.public.user.where({ username }).first()
        if (!user) {
            throw new HttpError(401, "Username atau password salah.")
        }

        const organization = await db.orm.public.organisasi
            .where({ id: user.organisasi_id, isActive: true })
            .select("id", "kode")
            .first()
        if (!organization) {
            throw new HttpError(401, "Organisasi anda tidak ditemukan atau sudah tidak aktif.")
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            throw new HttpError(401, "Username atau password salah.")
        }

        // generate JWT token
        const token = generateJWT(user.id, organization.kode, organization.id, user.username)
        
        // update latest login timestamp
        await db.orm.public.user.where({ id: user.id }).update({ latestLogin: new Date().toISOString() })

        return { user:{
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            kode_organisasi: organization.kode,
        }, token }
    }
}

export const userService = new UserService()
