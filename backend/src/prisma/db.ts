import "dotenv/config";
import { createRequire } from "node:module";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.d";
import type contractJsonType from "./contract.json";

const require = createRequire(import.meta.url);
const contractJson: typeof contractJsonType = require("./contract.json");

export const db = postgres<Contract>({
    contractJson,
    url: process.env["DATABASE_URL"]!,
});
