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
        expect(response.body).toEqual({ message: "Unauthorized" })
        expect(getParticipants).not.toHaveBeenCalled()
    })

    it("rejects a malformed bearer token", async () => {
        const response = await request(app)
            .get("/api/peserta/ORG001")
            .set("Authorization", "Bearer not-a-jwt")

        expect(response.status).toBe(401)
        expect(response.body).toEqual({ message: "Invalid token" })
    })

    it("rejects an expired bearer token", async () => {
        const response = await request(app)
            .get("/api/peserta/ORG001")
            .set("Authorization", expiredAuthorizationHeader())

        expect(response.status).toBe(401)
        expect(response.body).toEqual({ message: "Token expired" })
    })

    it("accepts a valid bearer token on a protected route", async () => {
        jest.spyOn(pesertaService, "getAllPesertaByOrganizationCode").mockResolvedValue([])

        const response = await request(app)
            .get("/api/peserta/ORG001")
            .set("Authorization", authorizationHeader())

        expect(response.status).toBe(200)
        expect(response.body.data).toEqual([])
    })
})
