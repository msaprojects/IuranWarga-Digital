import { db } from "../prisma/db.ts"
import { HttpError } from "../utils/http_error.ts"

type StatusKeluargaValue =
    | "KEPALA_KELUARGA"
    | "SUAMI"
    | "ISTRI"
    | "ANAK"
    | "ORANG_TUA"
    | "LAINNYA"

export type CreateDetailPesertaInput = {
    peserta_id: number
    nama: string
    status_keluarga: StatusKeluargaValue
    isActive: boolean
}

export type UpdateDetailPesertaInput = Partial<
    Pick<CreateDetailPesertaInput, "nama" | "status_keluarga" | "isActive">
>

class DetailPesertaService {
    getDetailPesertaByPesertaID(peserta_id: number) {
        const data = db.orm.public.detail_peserta.where({ peserta_id: peserta_id }).all()
        if (!data) {
            throw new HttpError(404, "Data Not Found")
        }
        return data
    }

    getDetailPesertaById(id: number) {
        const data = db.orm.public.detail_peserta.where({ id: id }).first()
        if (!data) {
            throw new HttpError(404, "Data Not Found")
        }
        return data
    }

    async createDetailPeserta(input: CreateDetailPesertaInput) {
        const dataPeserta = await db.orm.public.peserta.where({ id: input.peserta_id }).first()
        if (!dataPeserta) {
            throw new HttpError(404, "Data Peserta Tidak Ditemukan / Sudah Tidak aktif")
        }

        return db.orm.public.detail_peserta.create({
            peserta_id: input.peserta_id,
            nama: input.nama,
            status_keluarga: input.status_keluarga,
            isActive: input.isActive,
        })
    }

    async updateDataDetailPeserta(id:number,input: UpdateDetailPesertaInput){
        const findDetailPeserta = await db.orm.public.detail_peserta.where({ id: id }).first()
        if (!findDetailPeserta) {
            throw new HttpError(404, "Data Not Found")
        }
        return db.orm.public.detail_peserta.where({ id: id }).update({
            nama: input.nama ?? findDetailPeserta.nama,
            status_keluarga: input.status_keluarga ?? findDetailPeserta.status_keluarga,
            isActive: input.isActive ?? findDetailPeserta.isActive,
        })
    }

    async deleteDataDetailPeserta(id: number) {
        const findDetailPeserta = await db.orm.public.detail_peserta.where({ id: id }).first()
        if (!findDetailPeserta) {
            throw new HttpError(404, "Data Not Found")
        }
        return db.orm.public.detail_peserta.where({ id: id }).delete()
    }
}

export const detailPesertaService = new DetailPesertaService()
