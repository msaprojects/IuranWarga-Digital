import { afterEach, describe, expect, it, jest } from "@jest/globals"
import { decryptQRCodeString, encryptQRCodeString, generateRandomCode } from "../src/utils/helper"
import { HttpError } from "../src/utils/http_error.ts"

describe("generateRandomCode", () => {
    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe("decryptQRCodeString", () => {
        it("mendekripsi QR Code yang valid", () => {
            const encrypted = encryptQRCodeString("ORG001", "PST001")

            expect(decryptQRCodeString(encrypted)).toBe("ORG001:PST001")
        })

        it("mengenali HttpError untuk QR Code tidak valid", () => {
            try {
                decryptQRCodeString("bukan-qr-yang-valid")
                throw new Error("Expected decryption to fail.")
            } catch (error) {
                expect(error).toBeInstanceOf(HttpError)
                if (!(error instanceof HttpError)) {
                    throw error
                }
                expect(error.statusCode).toBe(400)
            }
        })
    })

    it("menghasilkan kode dengan panjang di antara batas minimum dan maksimum", () => {
        for (let attempt = 0; attempt < 100; attempt++) {
            const code = generateRandomCode(6, 8)

            expect(code.length).toBeGreaterThanOrEqual(6)
            expect(code.length).toBeLessThanOrEqual(8)
            expect(code).toMatch(/^[A-Z0-9]+$/)
        }
    })

    it("menghasilkan panjang minimum ketika nilai acak berada di awal rentang", () => {
        jest.spyOn(Math, "random").mockReturnValue(0)

        expect(generateRandomCode(6, 8)).toHaveLength(6)
    })

    it("menghasilkan panjang maksimum ketika nilai acak mendekati satu", () => {
        jest.spyOn(Math, "random").mockReturnValue(0.999999999)

        expect(generateRandomCode(6, 8)).toHaveLength(8)
    })

    it("mendukung panjang minimum dan maksimum yang sama", () => {
        const code = generateRandomCode(5, 5)

        expect(code).toHaveLength(5)
        expect(code).toMatch(/^[A-Z0-9]+$/)
    })
})
