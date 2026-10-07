import {db} from '../prisma/db.ts'

type createOrganisasi = {
    kode: string,
    nama: string,
    alamat: string | null,
    website: string | null,
    isActive: boolean,
    activeAt: string | null
}

type updateOrganisasi = {
    id: number,
    kode: string,
    nama: string,
    alamat: string | null,
    website: string | null,
    isActive: boolean,
    activeAt: string | null
}

export class OrganisasiService {
    async getOrganisasiByKode(kode: string) {
        return db.orm.public.organisasi.where({kode: kode}).first()
    }

    async createOrganisasi(data: createOrganisasi) {
        return db.orm.public.organisasi.create({
            kode: data.kode,
            nama: data.nama,
            alamat: data.alamat,
            website: data.website,
            isActive: data.isActive,
            activeAt: data.activeAt,
        })
    }

    async updateOrganisasi(data: updateOrganisasi) {
        return db.orm.public.organisasi.where({id: data.id}).update({
            kode: data.kode,
            nama: data.nama,
            alamat: data.alamat,
            website: data.website,
            isActive: data.isActive,
            activeAt: data.activeAt,
        })
    }
}