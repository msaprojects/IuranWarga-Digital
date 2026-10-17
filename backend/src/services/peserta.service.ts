import { encryptQRCodeString, generateRandomCode, decryptQRCodeString } from "./../utils/helper"
import { db } from "../prisma/db.ts"
import { orgService } from "./organisasi.service.ts"
import { writeQrCodeWithLabel } from "../utils/qr_code.ts"
import path from "path"
import * as fs from "node:fs"
import { HttpError } from "../utils/http_error.ts"

export type CreatePesertaInput = {
    kode?: string
    nama: string
    nomor_rumah?: string
    alamat?: string
    deskripsi?: string
    qr_token?: string
    isActive?: boolean
    organisasi_id: number
    user_id: number
}

export type UpdatePesertaInput = Partial<
    Pick<
        CreatePesertaInput,
        "nama" | "nomor_rumah" | "alamat" | "deskripsi" | "qr_token" | "isActive" | "user_id"
    >
>

class PesertaService {
    async getPesertaByIdAndOrganizationCode(id: number, organizationCode: string) {
        const findOrganisasiByKode = await orgService.getByKode(organizationCode)

        if (!findOrganisasiByKode) {
            throw new HttpError(404, "Organisasi tidak ditemukan, atau sudah tidak aktif.")
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
            .first()
    }

    async getAllPesertaByOrganizationCode(organizationCode: string) {
        const findOrganisasiByKode = await orgService.getByKode(organizationCode)
        if (!findOrganisasiByKode) {
            throw new HttpError(404, "Organisasi tidak ditemukan, atau sudah tidak aktif.")
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
            .all()
    }

    async createPeserta(input: CreatePesertaInput) {
        const organization = await db.orm.public.organisasi
            .where({ id: input.organisasi_id, isActive: true })
            .select("id")
            .first()
        if (!organization) {
            throw new HttpError(404, "Organisasi tidak ditemukan atau tidak aktif.")
        }

        if (
            input.qr_token &&
            (await db.orm.public.peserta.where({ qr_token: input.qr_token }).first())
        ) {
            throw new HttpError(409, "QR Code sudah digunakan.")
        }

        let generateCode = input.kode ?? generateRandomCode(6, 8)
        const findPesertaByKode = await db.orm.public.peserta
            .where({ kode: generateCode, organisasi_id: input.organisasi_id })
            .first()

        if (findPesertaByKode) {
            if (input.kode) {
                throw new HttpError(409, "Kode peserta sudah digunakan, silakan gunakan kode lain.")
            }
            // jika kode tidak diisi, maka system akan mencoba generate kode baru hingga 5 kali
            for (let i = 0; i < 5; i++) {
                generateCode = generateRandomCode(6, 8)
                const findPesertaByKode = await db.orm.public.peserta
                    .where({ kode: generateCode, organisasi_id: input.organisasi_id })
                    .first()
                if (!findPesertaByKode) {
                    break
                } else if (i === 4) {
                    throw new HttpError(
                        503,
                        "Gagal membuat kode peserta unik setelah 5 percobaan, silakan coba lagi.",
                    )
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
        })
    }

    async updatePeserta(id: number, input: UpdatePesertaInput) {
        const findPesertaById = await db.orm.public.peserta.where({ id }).first()

        if (!findPesertaById) {
            throw new HttpError(404, "Peserta tidak ditemukan.")
        }

        if (input.qr_token && input.qr_token !== findPesertaById.qr_token) {
            const existingQrCode = await db.orm.public.peserta
                .where({ qr_token: input.qr_token })
                .first()
            if (existingQrCode) {
                throw new HttpError(409, "QR Code sudah digunakan.")
            }
        }

        return db.orm.public.peserta.where({ id }).update({
            nama: input.nama ?? findPesertaById.nama,
            nomor_rumah: input.nomor_rumah ?? findPesertaById.nomor_rumah,
            alamat: input.alamat ?? findPesertaById.alamat,
            deskripsi: input.deskripsi ?? findPesertaById.deskripsi,
            qr_token: input.qr_token ?? findPesertaById.qr_token,
            isActive: input.isActive ?? findPesertaById.isActive,
            user_id: input.user_id ?? findPesertaById.user_id,
        })
    }

    async generateQrCode(kodePeserta: string, kodeOrganisasi: string): Promise<string> {
        const organization = await orgService.getByKode(kodeOrganisasi)
        if (!organization) {
            throw new HttpError(404, "Organisasi tidak ditemukan, atau sudah tidak aktif.")
        }

        const findPeserta = await db.orm.public.peserta
            .where({ kode: kodePeserta, organisasi_id: Number(organization.id), isActive: true })
            .first()

        if (!findPeserta) {
            throw new HttpError(404, "Data Peserta tidak ditemukan.")
        }

        const qrCodeString = encryptQRCodeString(kodeOrganisasi, kodePeserta)
        // check in database first before returning the qrCodeString
        if (!qrCodeString) {
            throw new Error("Gagal membuat QR Code, silakan coba lagi.")
        }
        const targetDir = path.join(__dirname, "..", "..", "uploads", "qrcodes")
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true })
        }

        const qrFileName = `${Buffer.from(qrCodeString).toString("base64url")}.png`
        const filePath = path.join(targetDir, qrFileName)

        await writeQrCodeWithLabel(filePath, qrCodeString, findPeserta.kode)

        await db.orm.public.peserta.where({ id: findPeserta.id }).update({
            qr_token: qrCodeString,
            qr_path: path.basename(filePath),
        })

        return String(process.env.URL_PATH + filePath)
    }

    async decryptQrCode(qrCodeString: string) {
        const decryptedData = await decryptQRCodeString(qrCodeString)
        if (!decryptedData) {
            throw new HttpError(400, "String QR Code tidak valid.")
        }
        const [kodeOrganisasi, kodePeserta] = decryptedData.split(":")
        if (!kodeOrganisasi || !kodePeserta) {
            throw new HttpError(400, "String QR Code tidak valid.")
        }
        const findOrganisasiByKode = await orgService.getByKode(String(kodeOrganisasi))
        if (!findOrganisasiByKode) {
            throw new HttpError(404, "Organisasi tidak ditemukan, atau sudah tidak aktif.")
        }
        const findPesertaByKode = await db.orm.public.peserta
            .where({ kode: String(kodePeserta), organisasi_id: Number(findOrganisasiByKode.id) })
            .first()
        if (!findPesertaByKode) {
            throw new HttpError(404, "Peserta tidak ditemukan, atau sudah tidak aktif.")
        }
        return findPesertaByKode
    }

    async revokeQRCode(id: number, organizationCode: string) {
        const organization = await orgService.getByKode(organizationCode)
        if (!organization) {
            throw new HttpError(404, "Organisasi tidak ditemukan, atau sudah tidak aktif.")
        }
        
        const peserta = await db.orm.public.peserta
            .where({ id, organisasi_id: Number(organization.id) })
            .update({ qr_token: null, qr_path: null })
        if (!peserta) {
            throw new HttpError(404, "Peserta tidak ditemukan.")
        }

        return peserta
    }

    async downloadQrCode(qrUrl: string) {
        const qrFileName = qrUrl.split(/[\\/]/).at(-1)
        const findQrCode = await db.orm.public.peserta.where({ qr_path: qrFileName }).first()
        if (!findQrCode?.qr_path) {
            throw new HttpError(
                404,
                "QR Code tidak ditemukan atau kadaluarsa, harap generate kembali.",
            )
        }

        const targetDir = path.join(__dirname, "uploads", "qrcodes")
        const filePath = path.join(targetDir, path.basename(findQrCode.qr_path))
        try {
            return fs.readFileSync(filePath)
        } catch (error) {
            if (error instanceof Error && "code" in error && error.code === "ENOENT") {
                throw new HttpError(
                    404,
                    "QR Code tidak ditemukan atau kadaluarsa, harap generate kembali.",
                )
            }
            throw error
        }
    }
}

export const pesertaService = new PesertaService()
