import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals"
import request from "supertest"
import app from "../src/app.ts"
import { userService } from "../src/services/user.service"
import { HttpError } from "../src/utils/http_error.ts"
import { authorizationHeader } from "./auth.ts"

const user = {
    id: 1,
    latestLogin: null,
    username: "admin01",
    name: "Admin Organisasi",
    role: "ADMIN",
    organisasi_id: 1,
    isActive: true,
    email: null,
    contact: null,
} satisfies NonNullable<Awaited<ReturnType<typeof userService.getUserByIdAndOrganizationCode>>>

const createUser = {
    id: 2,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    latestLogin: null,
    username: "user01",
    name: "User Organisasi",
    password: "password123",
    role: "USER",
    organisasi_id: 1,
    isActive: true,
    email: null,
    contact: null,
} satisfies Awaited<ReturnType<typeof userService.createUser>>

beforeEach(() => {
    jest.spyOn(userService, "getUserByIdAndOrganizationCode").mockImplementation(
        async (id, kode) => (id === 1 && kode === "ORG001" ? user : null),
    )
    jest.spyOn(userService, "getUsersByOrganizationCode").mockImplementation(async (kode) =>
        kode === "ORG001" ? [user] : [],
    )
    jest.spyOn(userService, "createUser").mockResolvedValue(createUser)
    jest.spyOn(userService, "updateUser").mockResolvedValue(createUser)
    jest.spyOn(userService, "loginUser").mockResolvedValue({
        user: {
            id: 1,
            username: "admin01",
            name: "Admin Organisasi",
            role: "ADMIN",
            kode_organisasi: "ORG001",
        },
        token: authorizationHeader().slice("Bearer ".length),
    })
})

afterEach(() => {
    jest.restoreAllMocks()
})

const authenticated = {
    get: (url: string) => request(app).get(url).set("Authorization", authorizationHeader()),
    post: (url: string) => request(app).post(url).set("Authorization", authorizationHeader()),
    patch: (url: string) => request(app).patch(url).set("Authorization", authorizationHeader()),
}

describe("User API", () => {
    it("mengambil daftar user berdasarkan kode organisasi", async () => {
        const response = await authenticated.get("/api/users/ORG001")

        expect(response.status).toBe(200)
        expect(response.body.data).toEqual([
            expect.objectContaining({ id: 1, username: "admin01", organisasi_id: 1 }),
        ])
        expect(userService.getUsersByOrganizationCode).toHaveBeenCalledWith("ORG001")
    })

    it("mengambil detail user berdasarkan ID dan kode organisasi", async () => {
        const response = await authenticated.get("/api/user/1/ORG001")

        expect(response.status).toBe(200)
        expect(response.headers["content-type"]).toMatch(/json/)
        expect(response.body.data).toEqual(
            expect.objectContaining({
                id: 1,
                username: "admin01",
                name: "Admin Organisasi",
                role: "ADMIN",
                organisasi_id: 1,
            }),
        )
        expect(userService.getUserByIdAndOrganizationCode).toHaveBeenCalledWith(1, "ORG001")
    })

    it("membuat user baru", async () => {
        const response = await authenticated.post("/api/user").send({
            username: "user01",
            name: "User Organisasi",
            password: "password123",
            role: "USER",
            organisasi_id: 1,
            isActive: true,
        })

        expect(response.status).toBe(201)
        expect(response.body.data).toEqual(
            expect.objectContaining({ id: 2, username: "user01", name: "User Organisasi" }),
        )
        expect(userService.createUser).toHaveBeenCalled()
    })

    it("mengembalikan 404 jika organisasi untuk user tidak ditemukan", async () => {
        jest.spyOn(userService, "createUser").mockRejectedValueOnce(
            new HttpError(404, "Organisasi tidak ditemukan atau tidak aktif."),
        )

        const response = await authenticated.post("/api/user").send({
            username: "user02",
            name: "User Organisasi",
            password: "password123",
            role: "USER",
            organisasi_id: 999,
        })

        expect(response.status).toBe(404)
        expect(response.body.message).toBe("Organisasi tidak ditemukan atau tidak aktif.")
    })

    it("mengembalikan 409 jika username sudah digunakan", async () => {
        jest.spyOn(userService, "createUser").mockRejectedValueOnce(
            new HttpError(409, "Username sudah digunakan."),
        )

        const response = await authenticated.post("/api/user").send({
            username: "user01",
            name: "User Organisasi",
            password: "password123",
            role: "USER",
            organisasi_id: 1,
        })

        expect(response.status).toBe(409)
        expect(response.body.message).toBe("Username sudah digunakan.")
    })

    it("memperbarui user", async () => {
        const response = await authenticated.patch("/api/user/2").send({
            name: "User Organisasi Diperbarui",
        })

        expect(response.status).toBe(200)
        expect(response.body.data).toEqual(expect.objectContaining({ id: 2, username: "user01" }))
        expect(userService.updateUser).toHaveBeenCalled()
    })

    it("mengembalikan 404 jika user tidak ditemukan", async () => {
        const response = await authenticated.get("/api/user/2/ORG001")

        expect(response.status).toBe(404)
        expect(userService.getUserByIdAndOrganizationCode).toHaveBeenCalledWith(2, "ORG001")
    })

    it("mengembalikan 404 jika kode organisasi tidak cocok", async () => {
        const response = await authenticated.get("/api/user/1/ORG002")

        expect(response.status).toBe(404)
        expect(userService.getUserByIdAndOrganizationCode).toHaveBeenCalledWith(1, "ORG002")
    })

    it("melakukan login dan mengembalikan access token", async () => {
        const response = await request(app).post("/api/user/login").send({
            username: "admin01",
            password: "password123",
        })

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            status: "success",
            message: "Login berhasil",
            data: {
                user: expect.objectContaining({ username: "admin01", kode_organisasi: "ORG001" }),
                token: expect.any(String),
            },
        })
        expect(userService.loginUser).toHaveBeenCalledWith("admin01", "password123")

        const protectedResponse = await request(app)
            .get("/api/users/ORG001")
            .set("Authorization", `Bearer ${response.body.data.token}`)
        expect(protectedResponse.status).toBe(200)
    })

    it("mengembalikan 401 jika kredensial login salah", async () => {
        jest.spyOn(userService, "loginUser").mockRejectedValueOnce(
            new HttpError(401, "Username atau password salah."),
        )

        const response = await request(app).post("/api/user/login").send({
            username: "admin01",
            password: "password123",
        })

        expect(response.status).toBe(401)
        expect(response.body.message).toBe("Username atau password salah.")
    })
})
