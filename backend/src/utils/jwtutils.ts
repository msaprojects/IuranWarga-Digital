import jwt from "jsonwebtoken"

export const generateJWT = (userId: number, orgKode: string, orgId: number, username: string) => {
    const token = jwt.sign({ userId, orgKode, orgId, username }, process.env.JWT_SECRET as string, {
        expiresIn: "1h",
    })

    return token
}
