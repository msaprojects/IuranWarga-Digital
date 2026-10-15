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
        kode === organisasi.kode ? organisasi : null,
    );
    jest.spyOn(orgService, "create").mockResolvedValue(organisasi);
    jest.spyOn(orgService, "updateByKode").mockResolvedValue(organisasi);
    jest.spyOn(orgService, "deactivateByKode").mockResolvedValue({
        ...organisasi,
        isActive: false,
    });
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe("Organisasi API", () => {
    it("seharusnya menyediakan OpenAPI spec, Swagger UI, dan Redoc", async () => {
        const specResponse = await request(app).get("/api-docs.json");
        const uiResponse = await request(app).get("/api-docs/");
        const redocResponse = await request(app).get("/redoc");

        expect(specResponse.status).toBe(200);
        expect(specResponse.body.openapi).toBe("3.1.0");
        expect(
            specResponse.body.paths["/organisasi"].post.requestBody.content["application/json"]
                .schema.$ref,
        ).toBe("#/components/schemas/CreateOrganisasiWithUserInput");
        expect(specResponse.body.components.schemas.CreateOrganisasiWithUserInput.required).toEqual([
            "organisasi",
            "user",
        ]);
        expect(specResponse.body.paths["/organisasi/{kode}"].patch).toBeDefined();
        expect(uiResponse.status).toBe(200);
        expect(uiResponse.text).toContain("Swagger UI");
        expect(redocResponse.status).toBe(200);
        expect(redocResponse.text).toContain("/api-docs.json");
        expect(redocResponse.text.toLowerCase()).toContain("redoc");
    });

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
            new Error("database credentials must not be exposed"),
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

    it("seharusnya membuat organisasi dengan nilai opsional default", async () => {
        const response = await request(app)
            .post("/api/organisasi")
            .send({
                organisasi: { kode: " ORG001 ", nama: " Warga01 " },
                user: {
                    username: " admin01 ",
                    name: " Admin Organisasi ",
                    password: "password1",
                },
            });

        expect(response.status).toBe(201);
        expect(orgService.create).toHaveBeenCalledWith({
            organisasi: {
                kode: "ORG001",
                nama: "Warga01",
                alamat: null,
                website: null,
                isActive: true,
                activeAt: null,
                email: null,
                contact: null,
            },
            user: {
                username: "admin01",
                name: "Admin Organisasi",
                password: "password1",
                email: null,
                contact: null,
            },
        });
    });

    it("seharusnya menolak pembuatan organisasi dengan body tidak valid", async () => {
        const response = await request(app).post("/api/organisasi").send({ kode: "ORG001" });

        expect(response.status).toBe(400);
        expect(orgService.create).not.toHaveBeenCalled();
    });

    it("seharusnya memperbarui organisasi berdasarkan kode", async () => {
        const response = await request(app)
            .patch("/api/organisasi/ORG001")
            .send({ nama: "Nama Baru" });

        expect(response.status).toBe(200);
        expect(orgService.updateByKode).toHaveBeenCalledWith("ORG001", {
            nama: "Nama Baru",
        });
    });

    it("seharusnya menolak update kosong", async () => {
        const response = await request(app).patch("/api/organisasi/ORG001").send({});

        expect(response.status).toBe(400);
        expect(orgService.updateByKode).not.toHaveBeenCalled();
    });

    it("seharusnya mengembalikan 404 saat organisasi tidak ditemukan untuk update", async () => {
        jest.spyOn(orgService, "updateByKode").mockResolvedValueOnce(null);

        const response = await request(app)
            .patch("/api/organisasi/ORG999")
            .send({ nama: "Nama Baru" });

        expect(response.status).toBe(404);
    });

    it("seharusnya menonaktifkan organisasi melalui DELETE", async () => {
        const response = await request(app).delete("/api/organisasi/ORG001");

        expect(response.status).toBe(200);
        expect(response.body.data.isActive).toBe(false);
        expect(orgService.deactivateByKode).toHaveBeenCalledWith("ORG001");
    });
});
