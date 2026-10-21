import { afterEach, describe, expect, it, jest } from "@jest/globals"
import request from "supertest"
import app from "../src/app.ts"
import { pesertaService } from "../src/services/peserta.service"
import { authorizationHeader, expiredAuthorizationHeader } from "./auth.ts"

describe("JWT authentication", () => {
    afterEach(() => {
        jest.restoreAllMocks()
    })

    it("rejects a protected route when the Authorization header is missing", async () => {
        const getParticipants = jest.spyOn(pesertaService, "getAllPesertaByOrganizationCode")
        const response = await request(app).get("/api/peserta/ORG001")

        expect(response.status).toBe(401)
        // Setelah refactor: envelope error konsisten `{status:"failed", message:...}`
        // dan pesan dalam Bahasa Indonesia agar tidak ambigu dengan HTTP status text.
        expect(response.body).toEqual(
            expect.objectContaining({
                status: "failed",
                message: "Token autentikasi tidak ditemukan.",
            }),
        )
        expect(getParticipants).not.toHaveBeenCalled()
    })

    it("rejects a malformed bearer token", async () => {
        const response = await request(app)
            .get("/api/peserta/ORG001")
            .set("Authorization", "Bearer not-a-jwt")

        expect(response.status).toBe(401)
        expect(response.body).toEqual(
            expect.objectContaining({
                status: "failed",
                message: "Token tidak valid.",
            }),
        )
    })

    it("rejects an expired bearer token", async () => {
        const response = await request(app)
            .get("/api/peserta/ORG001")
            .set("Authorization", expiredAuthorizationHeader())

        expect(response.status).toBe(401)
        expect(response.body).toEqual(
            expect.objectContaining({
                status: "failed",
                message: "Token telah kedaluwarsa.",
            }),
        )
    })

    it("accepts a valid bearer token on a protected route", async () => {
        jest.spyOn(pesertaService, "getAllPesertaByOrganizationCode").mockResolvedValue([])

        const response = await request(app)
            .get("/api/peserta/ORG001")
            .set("Authorization", authorizationHeader())

        expect(response.status).toBe(200)
        expect(response.body.data).toEqual([])
    })

    it("memapar header X-Request-Id di setiap response (korelasi log)", async () => {
        const response = await request(app).get("/api/peserta/ORG001")
        expect(response.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/u)
    })
})
