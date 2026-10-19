#!/usr/bin/env -S node
import type { Contract as Start } from "../../snapshots/12215829162ad2ef221fbb9afd3da0aa8545beaec7069888bf915192a643b2a0/contract"
import startContract from "../../snapshots/12215829162ad2ef221fbb9afd3da0aa8545beaec7069888bf915192a643b2a0/contract.json" with { type: "json" }
import type { Contract as End } from "../../snapshots/8aa1b11e3b297a630bacd2522d075533b5155aad244b6da0df3c44f4b0e655e7/contract"
import endContract from "../../snapshots/8aa1b11e3b297a630bacd2522d075533b5155aad244b6da0df3c44f4b0e655e7/contract.json" with { type: "json" }
import { Migration, MigrationCLI, col } from "@prisma/orm-postgres/migration"

export default class M extends Migration<Start, End> {
    override readonly startContractJson = startContract
    override readonly endContractJson = endContract

    override get operations() {
        return [
            this.dropColumn({ schema: "public", table: "peserta", column: "jenis" }),
            this.dropColumn({ schema: "public", table: "peserta", column: "nomor_kk" }),
            this.addColumn({
                schema: "public",
                table: "peserta",
                column: col("nama", "text", { codecRef: { codecId: "pg/text@1" } }),
            }),
            this.dropNotNull({ schema: "public", table: "peserta", column: "alamat" }),
        ]
    }
}

MigrationCLI.run(import.meta.url, M)
