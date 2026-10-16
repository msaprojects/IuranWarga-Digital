import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { generateRandomCode } from "../src/utils/helper";

describe("generateRandomCode", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("menghasilkan kode dengan panjang di antara batas minimum dan maksimum", () => {
        for (let attempt = 0; attempt < 100; attempt++) {
            const code = generateRandomCode(6, 8);

            expect(code.length).toBeGreaterThanOrEqual(6);
            expect(code.length).toBeLessThanOrEqual(8);
            expect(code).toMatch(/^[A-Z0-9]+$/);
        }
    });

    it("menghasilkan panjang minimum ketika nilai acak berada di awal rentang", () => {
        jest.spyOn(Math, "random").mockReturnValue(0);

        expect(generateRandomCode(6, 8)).toHaveLength(6);
    });

    it("menghasilkan panjang maksimum ketika nilai acak mendekati satu", () => {
        jest.spyOn(Math, "random").mockReturnValue(0.999999999);

        expect(generateRandomCode(6, 8)).toHaveLength(8);
    });

    it("mendukung panjang minimum dan maksimum yang sama", () => {
        const code = generateRandomCode(5, 5);

        expect(code).toHaveLength(5);
        expect(code).toMatch(/^[A-Z0-9]+$/);
    });
});
