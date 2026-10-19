import "dotenv/config"
import postgres from "@prisma/orm-postgres/runtime"
import type { Contract } from "./contract.d"
import contractJsonType from "./contract.json" with { type: "json" }

export const db = postgres<Contract>({
    contractJson: contractJsonType,
    url: process.env["DATABASE_URL"]!,
})
