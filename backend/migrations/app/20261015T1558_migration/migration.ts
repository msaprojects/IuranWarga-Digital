#!/usr/bin/env -S node
import type { Contract as End } from "../../snapshots/c92a323e173e1a94dc3269de877dbb156cac4752eacc00618cf797f33700c998/contract"
import endContract from "../../snapshots/c92a323e173e1a94dc3269de877dbb156cac4752eacc00618cf797f33700c998/contract.json" with { type: "json" }
import type { Contract as Start } from "../../snapshots/dd12f658e72e7c21ac0831949f212bd4c9c1de8479535c7a1b847fde0ee13f85/contract"
import startContract from "../../snapshots/dd12f658e72e7c21ac0831949f212bd4c9c1de8479535c7a1b847fde0ee13f85/contract.json" with { type: "json" }
import { Migration, MigrationCLI, col, lit } from "@prisma/orm-postgres/migration"

export default class M extends Migration<Start, End> {
    override readonly startContractJson = startContract
    override readonly endContractJson = endContract

    override get operations() {
        return [
            this.addColumn({
                schema: "public",
                table: "organisasi",
                column: col("activeAt", "timestamptz", {
                    codecRef: { codecId: "pg/timestamptz-string@1" },
                }),
            }),
            this.addColumn({
                schema: "public",
                table: "organisasi",
                column: col("isActive", "bool", {
                    notNull: true,
                    default: lit(true),
                    codecRef: { codecId: "pg/bool@1" },
                }),
            }),
            this.addColumn({
                schema: "public",
                table: "user",
                column: col("isActive", "bool", {
                    notNull: true,
                    default: lit(true),
                    codecRef: { codecId: "pg/bool@1" },
                }),
            }),
        ]
    }
}

MigrationCLI.run(import.meta.url, M)
