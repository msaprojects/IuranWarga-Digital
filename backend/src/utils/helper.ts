import crypto from "crypto"
import { HttpError } from "./http_error.ts"

const ENCRYPTION_KEY = crypto.scryptSync(String(process.env.ENCRYPTED_KEY), "salt", 32)
const ALGORITHM = "aes-256-gcm"

export interface EncryptedPayload {
    encryptedData: string
    iv: string
    authTag: string
}

export function encryptQRCodeString(kodeOrganisasi: string, kodePeserta: string): string {
    const iv = crypto.randomBytes(12) //=> initialize vector untuk AES-GCM
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

    let encrypted = cipher.update(`${kodeOrganisasi}:${kodePeserta}`, "utf8", "base64")
    encrypted += cipher.final("base64")

    // GCM membutuhkan Auth Tag untuk memastikan data tidak dimanipulasi
    const authTag = cipher.getAuthTag().toString("base64")
    const ivString = iv.toString("base64")

    return `${ivString}:${authTag}:${encrypted}`
}

export function decryptQRCodeString(encryptedString: string): string {
    const [ivString, authTagString, encryptedData] = encryptedString.split(":")

    if (!ivString || !authTagString || !encryptedData) {
        throw new HttpError(400, "String QR Code tidak valid.")
    }

    const iv = Buffer.from(ivString, "base64")
    const authTag = Buffer.from(authTagString, "base64")
    if (iv.length !== 12 || authTag.length !== 16) {
        throw new HttpError(400, "String QR Code tidak valid.")
    }

    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv)
        decipher.setAuthTag(authTag)

        let decrypted = decipher.update(encryptedData, "base64", "utf8")
        decrypted += decipher.final("utf8")

        return decrypted
    } catch {
        throw new HttpError(400, "String QR Code tidak valid.")
    }
}

export function generateRandomCode(minLength: number, maxLength: number): string {
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length)
        result += characters.charAt(randomIndex)
    }

    return result
}
