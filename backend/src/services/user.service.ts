import { db } from "../prisma/db.ts";

export type CreateUserInput = {
    username: string;
    name: string;
    password: string;
    role: "USER" | "ADMIN" | "SUPER_ADMIN";
    organisasi_id: number;
    latestLogin: string;
};

export type UpdateUserInput = Partial<
    Pick<CreateUserInput, "username" | "name" | "password" | "role" | "latestLogin">
>;

class UserService {
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

    private async getActiveOrganizationId(organizationCode: string) {
        const organization = await db.orm.public.organisasi
            .where({ kode: organizationCode, isActive: true })
            .select("id")
            .first();

        return organization?.id ?? null;
    }
}

export const userService = new UserService();
