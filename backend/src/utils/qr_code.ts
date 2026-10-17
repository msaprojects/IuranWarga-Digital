import QRCode from "qrcode"
import sharp from "sharp"

function escapeXmlText(value: string): string {
    const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
    }

    return value.replace(/[&<>"']/g, (character) => entities[character] ?? character)
}

export async function writeQrCodeWithLabel(
    filePath: string,
    qrCodeString: string,
    label: string,
): Promise<void> {
    const qrImage = await QRCode.toBuffer(qrCodeString, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 300,
    })
    const { width, height } = await sharp(qrImage).metadata()

    if (width === undefined || height === undefined) {
        throw new Error("Gagal membaca dimensi gambar QR Code.")
    }

    const labelHeight = 48
    const labelSvg = Buffer.from(
        `<svg width="${width}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
            <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
                font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="#111">
                ${escapeXmlText(label)}
            </text>
        </svg>`,
    )

    await sharp(qrImage)
        .extend({ bottom: labelHeight, background: "#fff" })
        .composite([{ input: labelSvg, left: 0, top: height }])
        .png()
        .toFile(filePath)
}
