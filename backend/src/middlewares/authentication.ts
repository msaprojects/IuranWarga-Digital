import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

export const authenticateJWT = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ message: "Unauthorized" })
            return
        }
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            userId: number
            orgKode: string
            orgId: number
            username: string
        }
        res.locals.user = decoded
        next()
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ message: "Token expired" })
            return
        } else if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ message: "Invalid token" })
            return
        }
        res.status(500).json({ message: "Server error during token verification" })
        return
    }
}
