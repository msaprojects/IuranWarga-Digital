import { db } from "../prisma/db.ts";

export type CreateOrganisasiInput = {
    kode: string;
    nama: string;
    alamat: string | null;
    website: string | null;
    isActive: boolean;
    activeAt: string | null;
};

export type UpdateOrganisasiInput = Partial<
    Pick<CreateOrganisasiInput, "kode" | "nama" | "alamat" | "website" | "activeAt">
>;

class OrganisasiService {
    getByKode(kode: string) {
        return db.orm.public.organisasi.where({ kode, isActive: true }).first();
    }

    create(input: CreateOrganisasiInput) {
        return db.orm.public.organisasi.create(input);
    }

    updateByKode(kode: string, input: UpdateOrganisasiInput) {
        return db.orm.public.organisasi.where({ kode, isActive: true }).update(input);
    }

    deactivateByKode(kode: string) {
        return db.orm.public.organisasi.where({ kode, isActive: true }).update({ isActive: false });
    }
}

export const orgService = new OrganisasiService();
