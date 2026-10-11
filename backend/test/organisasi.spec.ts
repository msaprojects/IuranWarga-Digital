import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import app from "../src/app.ts";
import { orgService } from "../src/services/organisasi.service.ts";

const organisasi = {
    activeAt: null,
    alamat: null,
    createdAt: "2025-01-01T00:00:00.000Z",
    id: 1,
    isActive: true,
    kode: "ORG001",
    nama: "Organisasi",
    updatedAt: "2025-01-01T00:00:00.000Z",
    website: null,
} satisfies NonNullable<Awaited<ReturnType<typeof orgService.getByKode>>>;

beforeEach(() => {
    jest.spyOn(orgService, "getByKode").mockImplementation(async (kode) =>
        kode === organisasi.kode ? organisasi : null
    );
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe("Get Organisasi by Kode", () => {
    it("seharusnya mengembalikan data organisasi dengan kode yang valid", async () => {
        const kode = "ORG001";
        const response = await request(app).get(`/api/organisasi/${kode}`);

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toMatch(/application\/json/);

        const organisasi = response.body.data ?? response.body;
        expect(organisasi).toEqual(expect.objectContaining({ kode }));
    });

    it("seharusnya menggunakan kode yang sudah dinormalisasi validator", async () => {
        const response = await request(app).get("/api/organisasi/%20ORG001%20");

        expect(response.status).toBe(200);
        expect(orgService.getByKode).toHaveBeenCalledWith("ORG001");
    });

    it("seharusnya mengembalikan 404 untuk kode organisasi yang tidak ditemukan", async () => {
        const response = await request(app).get("/api/organisasi/ORG999");

        expect(response.status).toBe(404);
        expect(response.headers["content-type"]).toMatch(/application\/json/);
    });

    it("seharusnya menolak kode dengan format yang tidak valid", async () => {
        const response = await request(app).get("/api/organisasi/!");

        expect(response.status).toBe(400);
        expect(response.headers["content-type"]).toMatch(/application\/json/);
        expect(orgService.getByKode).not.toHaveBeenCalled();
    });

    it("seharusnya mengembalikan 404 jika parameter kode tidak diberikan", async () => {
        const response = await request(app).get("/api/organisasi/");

        expect(response.status).toBe(404);
    });

    it("seharusnya tidak membocorkan detail error internal", async () => {
        jest.spyOn(orgService, "getByKode").mockRejectedValue(
            new Error("database credentials must not be exposed")
        );
        jest.spyOn(console, "error").mockImplementation(() => undefined);

        const response = await request(app).get("/api/organisasi/ORG001");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            status: "failed",
            message: "Internal Server Error",
        });
        expect(JSON.stringify(response.body)).not.toContain("credentials");
    });

    it("seharusnya mengembalikan 404 untuk route yang tidak ditemukan", async () => {
        const response = await request(app).get("/api/not-a-route");

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Route not found");
    });
});