import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { db } from "../prisma/db.ts"

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
        // find isActive Flag in user table and org table
        if (!decoded) {
            res.status(401).json({ message: "Unauthorized" })
            return
        }

        const findUser = await db.orm.public.user.where({ id: decoded.userId }).first()
        if (!findUser || !findUser.isActive) {
            res.status(401).json({ message: "Unauthorized" })
            return
        }

        const findOrg = await db.orm.public.organisasi.where({ id: decoded.orgId }).first()
        if (!findOrg || !findOrg.isActive) {
            res.status(401).json({ message: "Unauthorized" })
            return
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
