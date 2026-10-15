import { describe, expect, it, jest } from "@jest/globals";
import { userService } from "../src/services/user.service";
import { afterEach, beforeEach } from "node:test";

const user = {
    id: 1,
    latestLogin: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    username: "admin01",
    name: "Admin Organisasi",
    password: "password1",
    role: "ADMIN",
    organisasi_id: 1,
    isActive: true,
    email: null,
    contact: null,
} satisfies NonNullable<Awaited<ReturnType<typeof userService.getUserByIdAndOrganizationCode>>>;

beforeEach(() => {
    jest.spyOn(userService, "getUserByIdAndOrganizationCode").mockImplementation(async (id, kode) =>
        id === 1 && kode === "ORG001" ? user : null,
    );
    jest.spyOn(userService, "getUsersByOrganizationCode").mockImplementation(async (kode) =>
        kode === "ORG001" ? [user] : [],
    );
    jest.spyOn(userService, "createUser").mockResolvedValue(user);
    jest.spyOn(userService, "updateUser").mockResolvedValue(user);
})

afterEach(() => {
    jest.resetAllMocks();
})

describe("User Service", ()=>{
    it('seharusnya mengembalikan data user berdasarkan id dan kode organisasi yang valid', async () => {
        const result = await userService.getUserByIdAndOrganizationCode(1, "ORG001");
        expect(result).toEqual(user);
    });
})