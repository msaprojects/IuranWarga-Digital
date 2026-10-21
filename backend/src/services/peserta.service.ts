import { decryptQRCodeString, encryptQRCodeString, generateRandomCode } from "../utils/helper.ts"
import { db } from "../prisma/db.ts"
import { orgService } from "./organisasi.service.ts"
import { writeQrCodeWithLabel } from "../utils/qr_code.ts"
import path from "path"
import * as fs from "node:fs"
import { BadRequestError, HttpError, NotFoundError } from "../utils/http_error.ts"

// Kode peserta dibuat acak dengan panjang tetap; konstanta ini menjaga agar
// generator (service) dan validasi input (validator) tidak saling drift.
const KODE_MIN_LENGTH = 6
const KODE_MAX_LENGTH = 8
const KODE_MAX_RETRY = 5
const QR_FOLDER_SEGMENTS = ["uploads", "qrcodes"] as const

// Field peserta yang aman di-expose ke klien lewat endpoint list. Detail view
// menambah `qr_token` & `organisasi_id` karena pengguna memerlukan keduanya
// untuk aksi downstream (revoke/generate QR).
const PESERTA_LIST_SELECT = [
    "id",
    "kode",
    "nama",
    "nomor_rumah",
    "alamat",
    "deskripsi",
    "isActive",
    "user_id",
] as const
const PESERTA_DETAIL_SELECT = [...PESERTA_LIST_SELECT, "qr_token", "organisasi_id"] as const

export type CreatePesertaInput = {
    kode?: string
    nama: string
    nomor_rumah?: string | null
    alamat?: string | null
    deskripsi?: string | null
    qr_token?: string | null
    isActive?: boolean
    organisasi_id: number
    user_id?: number | null
}

export type UpdatePesertaInput = {
    nama?: string
    nomor_rumah?: string | null
    alamat?: string | null
    deskripsi?: string | null
    qr_token?: string | null
    isActive?: boolean
    user_id?: number | null
}

class PesertaService {
    // ---- read -----------------------------------------------------------

    async getAllPesertaByOrganizationCode(organizationCode: string) {
        const organization = await this.assertOrganisasiAktifByKode(organizationCode)
        return db.orm.public.peserta
            .where({ organisasi_id: organization.id, isActive: true })
            .select(...PESERTA_LIST_SELECT)
            .all()
    }

    async getPesertaByIdAndOrganizationCode(id: number, organizationCode: string) {
        const organization = await this.assertOrganisasiAktifByKode(organizationCode)
        const peserta = await db.orm.public.peserta
            .where({ id, organisasi_id: organization.id, isActive: true })
            .select(...PESERTA_DETAIL_SELECT)
            .first()
        if (!peserta) {
            throw new HttpError(404, "Peserta tidak ditemukan / sudah tidak aktif.")
        }
        return peserta
    }

    // ---- write ----------------------------------------------------------

    async createPeserta(input: CreatePesertaInput) {
        const organization = await this.assertOrganisasiAktif(input.organisasi_id)
        if (input.user_id != null) await this.assertUserAktif(input.user_id)
        if (input.qr_token) await this.assertQrTokenBebas(input.qr_token)

        const kode = await this.ensureUniqueKode(organization.id, input.kode)

        return db.orm.public.peserta.create({
            kode,
            nama: input.nama,
            nomor_rumah: input.nomor_rumah ?? null,
            alamat: input.alamat ?? null,
            deskripsi: input.deskripsi ?? null,
            qr_token: input.qr_token ?? null,
            isActive: input.isActive ?? true,
            organisasi_id: organization.id,
            user_id: input.user_id ?? null,
        })
    }

    async updatePeserta(id: number, input: UpdatePesertaInput) {
        const existing = await db.orm.public.peserta.where({ id }).first()
        if (!existing) {
            throw new HttpError(404, "Peserta tidak ditemukan.")
        }

        // QR token hanya diverifikasi bila berubah dan bukan null.
        if (input.qr_token && input.qr_token !== existing.qr_token) {
            await this.assertQrTokenBebas(input.qr_token)
        }
        if (input.user_id != null) await this.assertUserAktif(input.user_id)

        // PATCH semantics: field yang dikirim (termasuk `null` eksplisit)
        // akan menimpa; field `undefined` dipertahankan. `??` tidak cukup
        // karena tidak membedakan "klien mengirim null" vs "tidak dikirim".
        return db.orm.public.peserta.where({ id }).update({
            nama: this.pick(input.nama, existing.nama),
            nomor_rumah: this.pick(input.nomor_rumah, existing.nomor_rumah),
            alamat: this.pick(input.alamat, existing.alamat),
            deskripsi: this.pick(input.deskripsi, existing.deskripsi),
            qr_token: this.pick(input.qr_token, existing.qr_token),
            isActive: this.pick(input.isActive, existing.isActive),
            user_id: this.pick(input.user_id, existing.user_id),
        })
    }

    // ---- QR Code --------------------------------------------------------

    async generateQrCode(kodePeserta: string, kodeOrganisasi: string): Promise<string> {
        const organization = await this.assertOrganisasiAktifByKode(kodeOrganisasi)

        const peserta = await db.orm.public.peserta
            .where({ kode: kodePeserta, organisasi_id: organization.id, isActive: true })
            .first()
        if (!peserta) {
            throw new HttpError(404, "Peserta tidak ditemukan / sudah tidak aktif.")
        }

        const qrCodeString = encryptQRCodeString(kodeOrganisasi, kodePeserta)
        if (!qrCodeString) {
            // Gunakan HttpError agar errorHandler mengirim 500 dengan pesan rapi.
            throw new HttpError(500, "Gagal membuat QR Code, silakan coba lagi.")
        }

        const targetDir = path.join(process.cwd(), ...QR_FOLDER_SEGMENTS)
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true })
        }

        const qrFileName = `${Buffer.from(qrCodeString).toString("base64url")}.png`
        const filePath = path.join(targetDir, qrFileName)

        await writeQrCodeWithLabel(filePath, qrCodeString, peserta.kode)

        try {
            await db.orm.public.peserta.where({ id: peserta.id }).update({
                qr_token: qrCodeString,
                qr_path: qrFileName,
            })
        } catch (err) {
            // Best-effort rollback: hapus file yatim jika update DB gagal.
            // Kegagalan hapus file TIDAK boleh menelan error asli — cukup catat
            // di stderr agar ops tahu ada yatime file yang perlu di-prune.
            try {
                fs.rmSync(filePath, { force: true })
            } catch (rmErr) {
                console.warn(
                    JSON.stringify({
                        level: "warn",
                        event: "qr_rollback_failed",
                        file: qrFileName,
                        reason: (rmErr as Error)?.message ?? String(rmErr),
                    }),
                )
            }
            // Biarkan error Prisma mengalir apa adanya — errorHandler akan memetakan
            // SqlQueryError (mis. 23505 unique) ke 409, SqlConnectionError ke 503.
            throw err
        }

        // Kembalikan URL publik (bukan filesystem path absolut), agar
        // respons konsisten lintas OS & dapat dikonsumsi langsung oleh klien.
        const baseUrl = String(process.env.URL_PATH ?? "").replace(/\/+$/, "")
        const publicPath = QR_FOLDER_SEGMENTS.join("/")
        return `${baseUrl}/${publicPath}/${qrFileName}`
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
        const organization = await this.assertOrganisasiAktifByKode(kodeOrganisasi)
        const peserta = await db.orm.public.peserta
            .where({ kode: kodePeserta, organisasi_id: organization.id, isActive: true })
            .first()
        if (!peserta) {
            throw new HttpError(404, "Peserta tidak ditemukan / sudah tidak aktif.")
        }
        return peserta
    }

    async revokeQRCode(id: number, organizationCode: string) {
        const organization = await this.assertOrganisasiAktifByKode(organizationCode)

        const peserta = await db.orm.public.peserta
            .where({ id, organisasi_id: organization.id })
            .first()
        if (!peserta) {
            throw new HttpError(404, "Peserta tidak ditemukan.")
        }

        return db.orm.public.peserta.where({ id }).update({ qr_token: null, qr_path: null })
    }

    async downloadQrCode(qrUrl: string) {
        const qrFileName = qrUrl.split(/[\\/]/).at(-1)
        if (!qrFileName) {
            throw new BadRequestError("URL QR Code tidak valid.", { code: "CLIENT.QR_URL_INVALID" })
        }
        const findQrCode = await db.orm.public.peserta.where({ qr_path: qrFileName }).first()
        if (!findQrCode?.qr_path) {
            throw new NotFoundError(
                "QR Code tidak ditemukan atau kadaluarsa, harap generate kembali.",
                { code: "RESOURCE.QR_NOT_FOUND" },
            )
        }

        // Sama dengan generateQrCode: gunakan CWD sebagai akar folder upload
        // agar path identik walau source dir (`src/services`) != dist dir.
        const filePath = path.join(
            process.cwd(),
            ...QR_FOLDER_SEGMENTS,
            path.basename(findQrCode.qr_path),
        )
        try {
            return fs.readFileSync(filePath)
        } catch (error) {
            // ENOENT: baris DB ada tapi file hilang → 404 (konsisten dengan cek qr_path).
            if (
                error instanceof Error &&
                "code" in error &&
                (error as NodeJS.ErrnoException).code === "ENOENT"
            ) {
                throw new NotFoundError(
                    "Berkas QR Code tidak ditemukan di server, harap generate kembali.",
                    { code: "FS.QR_FILE_MISSING", cause: error },
                )
            }
            // EACCES/EPERM/EISDIR/dsb. biarkan mengalir → errorHandler peta ke 500 + code FS.
            throw error
        }
    }

    // ---- helpers --------------------------------------------------------

    /**
     * Bedakan "klien mengirim nilai" (termasuk `null`) vs "klien tidak mengirim field".
     * Hanya `undefined` yang jatuh ke fallback.
     */
    private pick<T>(incoming: T | undefined, fallback: T): T {
        return incoming !== undefined ? incoming : fallback
    }

    private async assertOrganisasiAktif(organisasi_id: number) {
        const org = await db.orm.public.organisasi
            .where({ id: organisasi_id, isActive: true })
            .select("id")
            .first()
        if (!org) {
            throw new HttpError(404, "Organisasi tidak ditemukan / sudah tidak aktif.")
        }
        return org
    }

    private async assertOrganisasiAktifByKode(kode: string) {
        const org = await orgService.getByKode(kode)
        if (!org) {
            throw new HttpError(404, "Organisasi tidak ditemukan / sudah tidak aktif.")
        }
        return org
    }

    private async assertUserAktif(user_id: number) {
        const u = await db.orm.public.user
            .where({ id: user_id, isActive: true })
            .select("id")
            .first()
        if (!u) throw new HttpError(404, "User tidak ditemukan / sudah tidak aktif.")
    }

    private async assertQrTokenBebas(qr_token: string) {
        const clash = await db.orm.public.peserta.where({ qr_token }).first()
        if (clash) throw new HttpError(409, "QR Code sudah digunakan.")
    }

    /**
     * Kembalikan kode yang dijamin unik dalam satu organisasi.
     * - `provided` diisi → pakai apa adanya, tolak bila sudah terpakai.
     * - `provided` kosong → generate acak, retry hingga KODE_MAX_RETRY.
     */
    private async ensureUniqueKode(organisasi_id: number, provided?: string): Promise<string> {
        if (provided) {
            const taken = await db.orm.public.peserta
                .where({ kode: provided, organisasi_id })
                .first()
            if (taken) {
                throw new HttpError(409, "Kode peserta sudah digunakan, silakan gunakan kode lain.")
            }
            return provided
        }

        for (let attempt = 0; attempt < KODE_MAX_RETRY; attempt++) {
            const candidate = generateRandomCode(KODE_MIN_LENGTH, KODE_MAX_LENGTH)
            const taken = await db.orm.public.peserta
                .where({ kode: candidate, organisasi_id })
                .first()
            if (!taken) return candidate
        }
        throw new HttpError(
            503,
            `Gagal membuat kode peserta unik setelah ${KODE_MAX_RETRY} percobaan, silakan coba lagi.`,
        )
    }
}

export const pesertaService = new PesertaService()
