import { db } from "../prisma/db.ts";
import type { CreateUserInput } from "./user.service.ts";
import { hash } from "bcrypt-ts";

export type CreateOrganisasiInput = {
    kode: string;
    nama: string;
    alamat: string | null;
    website: string | null;
    isActive: boolean;
    activeAt: string | null;
    email: string | null;
    contact: string | null;
};

export type UpdateOrganisasiInput = Partial<
    Pick<CreateOrganisasiInput, "kode" | "nama" | "alamat" | "website" | "activeAt">
>;

type CreateOrganisasiWithUserInput = {
    organisasi: CreateOrganisasiInput;
    user: {
        username: string;
        name: string;
        password: string;
        email: string | null;
        contact: string | null;
    };
};

class OrganisasiService {
    getByKode(kode: string) {
        return db.orm.public.organisasi.where({ kode, isActive: true }).first();
    }

    async create(input: CreateOrganisasiWithUserInput) {
        // return db.orm.public.organisasi.create(input);

        // ketika kode organisasi sudah ada, maka throw error
        const existingOrganisasi = await db.orm.public.organisasi
            .where({ kode: input.organisasi.kode, isActive: true })
            .first();
        if (existingOrganisasi) {
            throw new Error("Kode organisasi sudah ada.");
        }

        // create organisasi and user too!
        const createOrganisasi = await db.orm.public.organisasi.create(input.organisasi);
        await db.orm.public.user.create({
            username: input.user.username,
            name: input.user.name,
            password: await hash(input.user.password, 12),
            organisasi_id: createOrganisasi.id,
            role: "ADMIN",
            isActive: true,
        });

        return createOrganisasi;
    }

    updateByKode(kode: string, input: UpdateOrganisasiInput) {
        return db.orm.public.organisasi.where({ kode, isActive: true }).update(input);
    }

    deactivateByKode(kode: string) {
        return db.orm.public.organisasi.where({ kode, isActive: true }).update({ isActive: false });
    }
}

export const orgService = new OrganisasiService();
