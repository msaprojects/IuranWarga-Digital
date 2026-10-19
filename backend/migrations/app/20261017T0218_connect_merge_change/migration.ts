#!/usr/bin/env -S node
import type { Contract as End } from "../../snapshots/797d9ef55d08c27cfcabfd60e5326bb1097e60ad07909209b1f8d673d125ddb1/contract"
import endContract from "../../snapshots/797d9ef55d08c27cfcabfd60e5326bb1097e60ad07909209b1f8d673d125ddb1/contract.json" with { type: "json" }
import type { Contract as Start } from "../../snapshots/8aa1b11e3b297a630bacd2522d075533b5155aad244b6da0df3c44f4b0e655e7/contract"
import startContract from "../../snapshots/8aa1b11e3b297a630bacd2522d075533b5155aad244b6da0df3c44f4b0e655e7/contract.json" with { type: "json" }
import { Migration, MigrationCLI, col } from "@prisma/orm-postgres/migration"

export default class M extends Migration<Start, End> {
    override readonly startContractJson = startContract
    override readonly endContractJson = endContract

    override get operations() {
        return [
            this.addColumn({
                schema: "public",
                table: "peserta",
                column: col("qr_path", "text", { codecRef: { codecId: "pg/text@1" } }),
            }),
        ]
    }
}

MigrationCLI.run(import.meta.url, M)
