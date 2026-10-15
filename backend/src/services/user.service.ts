import { db } from "../prisma/db.ts";

export type CreateUserInput = {
    username: string;
    name: string;
    password: string;
    role: "USER" | "ADMIN" | "SUPER_ADMIN";
    organisasi_id: number;
    isActive?: boolean;
    email: string | null;
    contact: string | null;
};

export type UpdateUserInput = Partial<
    Pick<CreateUserInput, "username" | "name" | "password" | "role" | "organisasi_id" | "email" | "contact" | "isActive">
>;

class UserService {

    private async getActiveOrganizationId(organizationCode: string) {
        const organization = await db.orm.public.organisasi
            .where({ kode: organizationCode, isActive: true })
            .select("id")
            .first();

        return organization?.id ?? null;
    }
    
    /**
     * Mengambil data detail user berdasarkan ID dan Kode Organisasi.
     * alasan : Kenapa tidak ID saja? karena untuk memastikan user tersebut
     *          memang berada di organisasi yang sama dengan kode organisasi yang diberikan,
     *          sehingga menambah lapisan keamanan dan validasi.
     */
    async getUserByIdAndOrganizationCode(id: number, organizationCode: string) {
        const organizationId = await this.getActiveOrganizationId(organizationCode);
        if (organizationId === null) {
            return null;
        }

        return db.orm.public.user
            .where({ id, organisasi_id: organizationId })
            .select("id", "username", "name", "role", "organisasi_id", "latestLogin")
            .first();
    }

    async getUsersByOrganizationCode(organizationCode: string) {
        const organizationId = await this.getActiveOrganizationId(organizationCode);
        if (organizationId === null) {
            return [];
        }

        return db.orm.public.user
            .where({ organisasi_id: organizationId })
            .select("id", "username", "name", "role", "organisasi_id", "latestLogin")
            .all();
    }

    async createUser(input: CreateUserInput) {
        const organizationId = await this.getActiveOrganizationId(input.organisasi_id.toString());
        if (organizationId === null) {
            throw new Error("Organisasi tidak ditemukan atau tidak aktif.");
        }

        return db.orm.public.user.create({
            username: input.username,
            name: input.name,
            password: input.password,
            role: input.role,
            organisasi_id: organizationId,
            isActive: input.isActive ?? true,
            email: input.email,
            contact: input.contact,
     
        });
    }

    async updateUser(id: number, input: UpdateUserInput) {
        const user = await db.orm.public.user.where({ id }).first();
        if (!user) {
            throw new Error("User tidak ditemukan.");
        }

        return db.orm.public.user.where({ id }).update({
                username: input.username ?? user.username,
                name: input.name ?? user.name,
                password: input.password ?? user.password,
                role: input.role ?? user.role,
                organisasi_id: input.organisasi_id ?? user.organisasi_id,
                isActive: input.isActive ?? user.isActive,
                email: input.email ?? user.email,
                contact: input.contact ?? user.contact
            });
    }
}

export const userService = new UserService();
