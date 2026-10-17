import { afterEach, describe, expect, it } from "@jest/globals"
import { unlink } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"
import { randomUUID } from "node:crypto"
import sharp from "sharp"
import { writeQrCodeWithLabel } from "../src/utils/qr_code.ts"

const outputPath = path.join(tmpdir(), `qr-code-${randomUUID()}.png`)

afterEach(async () => {
    await unlink(outputPath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") {
            throw error
        }
    })
})

describe("writeQrCodeWithLabel", () => {
    it("writes a PNG with the participant code rendered below the QR code", async () => {
        await writeQrCodeWithLabel(outputPath, "encrypted-qr-token", "PST001")

        const image = sharp(outputPath)
        const metadata = await image.metadata()

        expect(metadata.format).toBe("png")
        expect(metadata.width).toBe(300)
        expect(metadata.height).toBe(348)

        const labelPixels = await image
            .extract({ left: 0, top: 300, width: 300, height: 48 })
            .removeAlpha()
            .raw()
            .toBuffer()

        const containsDarkText = Array.from(
            { length: labelPixels.length / 3 },
            (_, index) => labelPixels[index * 3] < 80,
        ).some(Boolean)

        expect(containsDarkText).toBe(true)
    }, 15_000)

    it("safely renders a label containing XML-special characters", async () => {
        await expect(
            writeQrCodeWithLabel(outputPath, "encrypted-qr-token", "P<&001"),
        ).resolves.toBeUndefined()
    }, 15_000)
})
