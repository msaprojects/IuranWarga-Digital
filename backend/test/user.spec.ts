import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { userService } from "../src/services/user.service";
import request from "supertest";
import app from "../src/app.ts";

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
} satisfies NonNullable<Awaited<ReturnType<typeof userService.getUserByIdAndOrganizationCode>>>;

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
} satisfies Awaited<ReturnType<typeof userService.createUser>>;

beforeEach(() => {
    jest.spyOn(userService, "getUserByIdAndOrganizationCode").mockImplementation(
        async (id, kode) => (id === 1 && kode === "ORG001" ? user : null),
    );
    jest.spyOn(userService, "getUsersByOrganizationCode").mockImplementation(async (kode) =>
        kode === "ORG001" ? [user] : [],
    );
    jest.spyOn(userService, "createUser").mockResolvedValue(createUser);
    jest.spyOn(userService, "updateUser").mockResolvedValue(createUser);
});

afterEach(() => {
    jest.resetAllMocks();
});

describe("User API", () => {
    it("seharusnya mengembalikan daftar user berdasarkan kode organisasi", async () => {
        const response = await request(app).get("/api/users/ORG001");

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([expect.objectContaining({
            id: 1,
            username: "admin01",
            organisasi_id: 1,
        })]);
        expect(userService.getUsersByOrganizationCode).toHaveBeenCalledWith("ORG001");
    });

    it("seharusnya mengembalikan data user berdasarkan id dan kode organisasi yang valid", async () => {
        const response = await request(app).get("/api/user/1/ORG001");

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);

        expect(response.body.data).toEqual(
            expect.objectContaining({
                id: 1,
                username: "admin01",
                name: "Admin Organisasi",
                role: "ADMIN",
                organisasi_id: 1,
            }),
        );
        expect(userService.getUserByIdAndOrganizationCode).toHaveBeenCalledWith(1, "ORG001");
    });

    it("seharusnya membuat user baru", async () => {
        const response = await request(app).post("/api/user").send({
            username: "user01",
            name: "User Organisasi",
            password: "password123",
            role: "USER",
            organisasi_id: 1,
            isActive: true,
        });
        
        expect(response.status).toBe(201);
        expect(response.body.data).toEqual(expect.objectContaining({
            id: 2,
            username: "user01",
            name: "User Organisasi",
        }));
        expect(userService.createUser).toHaveBeenCalled();
    });

    it("seharusnya memperbarui user", async () => {
        const response = await request(app).patch("/api/user/2").send({
            name: "User Organisasi Diperbarui",
        });
        
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(expect.objectContaining({
            id: 2,
            username: "user01",
        }));
        expect(userService.updateUser).toHaveBeenCalled();
    });

    
    it("seharusnya mengembalikan 404 jika user tidak ditemukan", async () => {
        const response = await request(app).get("/api/user/2/ORG001");

        expect(response.status).toBe(404);
        expect(userService.getUserByIdAndOrganizationCode).toHaveBeenCalledWith(2, "ORG001");
    });

    it("seharusnya mengembalikan 404 jika kode organisasi tidak cocok", async () => {
        const response = await request(app).get("/api/user/1/ORG002");

        expect(response.status).toBe(404);
        expect(userService.getUserByIdAndOrganizationCode).toHaveBeenCalledWith(1, "ORG002");
    });
    
});
