import { beforeEach, describe, expect, it, jest, mock } from "bun:test"
import jwt from "jsonwebtoken"
import { UnauthorizedError } from "../src/utils/http_error.ts"

// `loginUser` menandatangani token di dalam service, jadi secret harus sudah
// ada sebelum service dipanggil.
process.env.JWT_SECRET = "test-jwt-secret-login-integration"

// Rantai query `db.orm` dipalsukan seperti spec service lainnya. Bagian yang
// SENGAJA TIDAK dipalsukan justru inti test ini: `Bun.password.hash` di
// createUser dan `Bun.password.verify` di loginUser.
//
// Latar belakang: dulu hash dibuat dari `password.repeat(3)` tetapi diverifikasi
// tanpa pengulangan, sehingga login selalu gagal. Seluruh spec lama tidak
// menangkapnya karena `userService.loginUser` di-mock pada level API.
const mockFirst = jest.fn<(...args: any[]) => Promise<any>>()
const mockAll = jest.fn<(...args: any[]) => Promise<any>>()
const mockUpdate = jest.fn<(...args: any[]) => Promise<any>>()
const mockCreate = jest.fn<(...args: any[]) => Promise<any>>()
const mockSelect = jest.fn<(...args: any[]) => any>(() => ({
    first: mockFirst,
    all: mockAll,
}))
const mockWhere = jest.fn<(...args: any[]) => any>(() => ({
    first: mockFirst,
    all: mockAll,
    update: mockUpdate,
    select: mockSelect,
}))

mock.module("../src/prisma/db.ts", () => ({
    db: {
        orm: {
            public: {
                organisasi: { where: mockWhere },
                user: { where: mockWhere, create: mockCreate },
            },
        },
    },
}))

const { userService } = await import("../src/services/user.service.ts")

const PLAIN_PASSWORD = "password123"

const rowUser = (overrides: Record<string, unknown> = {}) => ({
    id: 7,
    username: "admin01",
    name: "Admin Organisasi",
    password: "hash",
    role: "ADMIN",
    organisasi_id: 1,
    isActive: true,
    email: null,
    contact: null,
    latestLogin: null,
    createdAt: "2026-11-10T00:00:00.000Z",
    updatedAt: "2026-11-10T00:00:00.000Z",
    ...overrides,
})

// bcrypt cost 12 cukup mahal, jadi hash asli dibuat sekali lalu dipakai ulang.
let storedHash = ""

async function seedUserThroughCreate(): Promise<string> {
    if (storedHash) return storedHash

    mockFirst.mockResolvedValueOnce({ id: 1 }) // organisasi aktif
    mockFirst.mockResolvedValueOnce(null) // username belum dipakai
    mockCreate.mockImplementation(async (data: any) => ({
        ...rowUser(data),
        password: data.password,
    }))

    await userService.createUser({
        username: "admin01",
        name: "Admin Organisasi",
        password: PLAIN_PASSWORD,
        role: "ADMIN",
        organisasi_id: 1,
        email: null,
        contact: null,
    })

    storedHash = String(mockCreate.mock.calls[0]?.[0]?.password)
    return storedHash
}

beforeEach(() => {
    mockFirst.mockReset()
    mockAll.mockReset()
    mockUpdate.mockReset()
    mockCreate.mockReset()
    mockSelect.mockClear()
    mockWhere.mockClear()
})

describe("Login integration (hash ↔ verify simetris)", () => {
    it("menyimpan hash (bukan plaintext) yang lolos verifikasi password asli", async () => {
        const hash = await seedUserThroughCreate()

        expect(hash).not.toBe(PLAIN_PASSWORD)
        await expect(Bun.password.verify(PLAIN_PASSWORD, hash)).resolves.toBe(true)
        // Regresi lama: hash dibuat dari `password.repeat(3)`.
        await expect(Bun.password.verify(PLAIN_PASSWORD.repeat(3), hash)).resolves.toBe(false)
    })

    it("loginUser mengembalikan token untuk user hasil createUser", async () => {
        const hash = await seedUserThroughCreate()
        mockFirst.mockResolvedValueOnce(rowUser({ password: hash }))
        mockFirst.mockResolvedValueOnce({ id: 1, kode: "ORG001" })
        mockUpdate.mockResolvedValue(rowUser({ password: hash }))

        const result = await userService.loginUser("admin01", PLAIN_PASSWORD)

        expect(result.user).toEqual({
            id: 7,
            username: "admin01",
            name: "Admin Organisasi",
            role: "ADMIN",
            kode_organisasi: "ORG001",
        })
        expect(result.user).not.toHaveProperty("password")
        expect(typeof result.token).toBe("string")
        expect(jwt.verify(result.token, process.env.JWT_SECRET as string)).toMatchObject({
            userId: 7,
            orgKode: "ORG001",
            orgId: 1,
            username: "admin01",
        })
        // Hanya latestLogin yang ditulis saat login.
        expect(mockUpdate).toHaveBeenCalledTimes(1)
    })

    it("menolak password salah dengan AUTH.INVALID_CREDENTIALS", async () => {
        const hash = await seedUserThroughCreate()
        mockFirst.mockResolvedValueOnce(rowUser({ password: hash }))
        mockFirst.mockResolvedValueOnce({ id: 1, kode: "ORG001" })

        const promise = userService.loginUser("admin01", "password-salah")

        await expect(promise).rejects.toBeInstanceOf(UnauthorizedError)
        await expect(promise).rejects.toMatchObject({
            statusCode: 401,
            code: "AUTH.INVALID_CREDENTIALS",
        })
    })

    it("menolak akun nonaktif meski password benar", async () => {
        const hash = await seedUserThroughCreate()
        mockFirst.mockResolvedValueOnce(rowUser({ password: hash, isActive: false }))
        mockFirst.mockResolvedValueOnce({ id: 1, kode: "ORG001" })

        await expect(userService.loginUser("admin01", PLAIN_PASSWORD)).rejects.toMatchObject({
            statusCode: 401,
            code: "AUTH.ACCOUNT_INACTIVE",
        })
    })

    it("menolak login saat organisasi nonaktif", async () => {
        const hash = await seedUserThroughCreate()
        mockFirst.mockResolvedValueOnce(rowUser({ password: hash }))
        mockFirst.mockResolvedValueOnce(null)

        await expect(userService.loginUser("admin01", PLAIN_PASSWORD)).rejects.toMatchObject({
            statusCode: 401,
            code: "ORG.INACTIVE",
        })
    })

    it("melempar 401 yang sama untuk username tidak dikenal (anti user-enumeration)", async () => {
        mockFirst.mockResolvedValueOnce(null)

        await expect(userService.loginUser("tidak-ada", PLAIN_PASSWORD)).rejects.toMatchObject({
            statusCode: 401,
            code: "AUTH.INVALID_CREDENTIALS",
        })
    })
})
