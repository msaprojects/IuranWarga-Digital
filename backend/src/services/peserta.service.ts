import { encryptQRCodeString, generateRandomCode, decryptQRCodeString } from "./../utils/helper";
import { db } from "../prisma/db.ts";
import { orgService } from "./organisasi.service.ts";
import { length } from "zod/v4-mini";

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
        "nama" | "nomor_rumah" | "alamat" | "deskripsi" | "qr_token" | "isActive" | "user_id"
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

    async getAllPesertaByOrganizationCode(organizationCode: string) {
        const findOrganisasiByKode = await orgService.getByKode(organizationCode);
        if (!findOrganisasiByKode) {
            throw new Error("Organisasi tidak ditemukan, atau sudah tidak aktif.");
        }
        return db.orm.public.peserta
            .where({ organisasi_id: Number(findOrganisasiByKode.id) })
            .select(
                "id",
                "kode",
                "nama",
                "nomor_rumah",
                "alamat",
                "deskripsi",
                "isActive",
                "user_id",
            )
            .all();
    }

    async createPeserta(input: CreatePesertaInput) {
        let generateCode = input.kode ?? generateRandomCode(6, 8);
        const findPesertaByKode = await db.orm.public.peserta.where({ kode: generateCode }).first();

        if (findPesertaByKode) {
            if (input.kode) {
                throw new Error("Kode peserta sudah digunakan, silakan gunakan kode lain.");
            }
            // jika kode tidak diisi, maka system akan mencoba generate kode baru hingga 5 kali
            for (let i = 0; i < 5; i++) {
                generateCode = generateRandomCode(6, 8);
                const findPesertaByKode = await db.orm.public.peserta
                    .where({ kode: generateCode })
                    .first();
                if (!findPesertaByKode) {
                    break;
                } else if (i === 4) {
                    throw new Error(
                        "Gagal membuat kode peserta unik setelah 5 percobaan, silakan coba lagi.",
                    );
                }
            }
        }

        return db.orm.public.peserta.create({
            kode: generateCode,
            nama: input.nama,
            nomor_rumah: input.nomor_rumah,
            alamat: input.alamat,
            deskripsi: input.deskripsi,
            qr_token: input.qr_token,
            isActive: input.isActive,
            organisasi_id: input.organisasi_id,
            user_id: input.user_id,
        });
    }

    async updatePeserta(id: number, input: UpdatePesertaInput) {
        const findPesertaById = await db.orm.public.peserta.where({ id }).first();

        if (!findPesertaById) {
            throw new Error("Peserta tidak ditemukan.");
        }

        return db.orm.public.peserta.where({ id }).update({
            nama: input.nama ?? findPesertaById.nama,
            nomor_rumah: input.nomor_rumah ?? findPesertaById.nomor_rumah,
            alamat: input.alamat ?? findPesertaById.alamat,
            deskripsi: input.deskripsi ?? findPesertaById.deskripsi,
            qr_token: input.qr_token ?? findPesertaById.qr_token,
            isActive: input.isActive ?? findPesertaById.isActive,
            user_id: input.user_id ?? findPesertaById.user_id,
        });
    }

    generateQrCode(kodeOrganisasi: string, kodePeserta: string): string {
        const qrCodeString = encryptQRCodeString(kodeOrganisasi, kodePeserta);
        // check in database first before returning the qrCodeString
        if (!qrCodeString) {
            throw new Error("Gagal membuat QR Code, silakan coba lagi.");
        }
        return qrCodeString;
    }

    async decryptQrCode(qrCodeString: string) {
        const decryptedData = await decryptQRCodeString(qrCodeString);
        if (!decryptedData) {
            throw new Error("Gagal mendekripsi QR Code, silakan coba lagi.");
        }
        // const select data from decryptedData
        const [kodeOrganisasi, kodePeserta] = decryptedData.split("-");
        const findOrganisasiByKode = await orgService.getByKode(String(kodeOrganisasi));
        if (!findOrganisasiByKode) {
            throw new Error("Organisasi tidak ditemukan, atau sudah tidak aktif.");
        }
        const findPesertaByKode = await db.orm.public.peserta
            .where({ kode: String(kodePeserta), organisasi_id: Number(findOrganisasiByKode.id) })
            .first();
        if (!findPesertaByKode) {
            throw new Error("Peserta tidak ditemukan, atau sudah tidak aktif.");
        }
        return findPesertaByKode;
    }

    revokeQRCode(id: number, organizationCode: string) {
        return db.orm.public.peserta.where({ id }).update({
            qr_token: null,
        });
    }
}

export const pesertaService = new PesertaService();
