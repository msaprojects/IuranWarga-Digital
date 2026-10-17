import jwt from "jsonwebtoken"

const testSecret = "test-jwt-secret-for-api-tests"
process.env.JWT_SECRET = testSecret

const testPayload = {
    userId: 1,
    orgKode: "ORG001",
    orgId: 1,
    username: "admin01",
}

export function authorizationHeader(): string {
    return `Bearer ${jwt.sign(testPayload, testSecret, { expiresIn: "1h" })}`
}

export function expiredAuthorizationHeader(): string {
    return `Bearer ${jwt.sign(testPayload, testSecret, { expiresIn: -1 })}`
}
