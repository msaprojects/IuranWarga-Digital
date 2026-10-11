import { db } from "../prisma/db.ts";

export type CreateOrganisasiInput = {
  kode: string;
  nama: string;
  alamat: string | null;
  website: string | null;
  isActive: boolean;
  activeAt: string | null;
};

export type UpdateOrganisasiInput = CreateOrganisasiInput & {
  id: number;
};

class OrganisasiService {
  getByKode(kode: string) {
    return db.orm.public.organisasi.where({ kode }).first();
  }

  create(input: CreateOrganisasiInput) {
    return db.orm.public.organisasi.create(input);
  }

  update(input: UpdateOrganisasiInput) {
    const { id, ...data } = input;
    return db.orm.public.organisasi.where({ id }).update(data);
  }
}

export const orgService = new OrganisasiService();
