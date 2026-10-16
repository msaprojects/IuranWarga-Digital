import { db } from "../prisma/db.ts";
import { orgService } from "./organisasi.service.ts";

export type CreatePesertaInput = {
    kode?: string;
    nama: string;
    nomor_rumah?: string;
    alamat?: string;
    deskripsi?: string;
    qr_token?: string;
    isActive?: boolean;
    organisasi_id: number;
    user_id: number;
};

export type UpdatePesertaInput = Partial<
    Pick<
        CreatePesertaInput,
        | "kode"
        | "nama"
        | "nomor_rumah"
        | "alamat"
        | "deskripsi"
        | "qr_token"
        | "isActive"
        | "user_id"
    >
>;

class PesertaService {
    async getPesertaByIdAndOrganizationCode(id: number, organizationCode: string) {
        const findOrganisasiByKode = await orgService.getByKode(organizationCode);
        if (!findOrganisasiByKode) {
            throw new Error("Organisasi tidak ditemukan, atau sudah tidak aktif.");
        }
        return db.orm.public.peserta
            .where({ id, organisasi_id: Number(findOrganisasiByKode.id) })
            .select(
                "id",
                "kode",
                "nama",
                "nomor_rumah",
                "alamat",
                "deskripsi",
                "qr_token",
                "isActive",
                "organisasi_id",
                "user_id",
            )
            .first();
    }
}
