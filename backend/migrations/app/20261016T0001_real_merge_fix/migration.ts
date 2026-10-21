#!/usr/bin/env -S node
import type { Contract as End } from "../../snapshots/12215829162ad2ef221fbb9afd3da0aa8545beaec7069888bf915192a643b2a0/contract"
import endContract from "../../snapshots/12215829162ad2ef221fbb9afd3da0aa8545beaec7069888bf915192a643b2a0/contract.json" with { type: "json" }
import type { Contract as Start } from "../../snapshots/fcb61b6a6c410d1204295cb853b4a96b2d7d6f59a85e9494b9ec74582deccf2f/contract"
import startContract from "../../snapshots/fcb61b6a6c410d1204295cb853b4a96b2d7d6f59a85e9494b9ec74582deccf2f/contract.json" with { type: "json" }
import {
    Migration,
    MigrationCLI,
    checkExpression,
    col,
    fn,
    placeholder,
    primaryKey,
} from "@prisma/orm-postgres/migration"
import postgres from "@prisma/orm-postgres/runtime"

// Build a typed contract view over the emitted end-contract JSON. `postgres(...)`
// connects lazily, so this opens no connection; its `contract` is the validated,
// branded `Contract<SqlStorage>` that `dataTransform` requires (the raw JSON import
// widens `namespace` to `string`, which fails to satisfy the branded `NamespaceId`).
const { contract } = postgres<End>({ contractJson: endContract })

export default class M extends Migration<Start, End> {
    override readonly startContractJson = startContract
    override readonly endContractJson = endContract

    override get operations() {
        return [
            this.dropConstraint({
                schema: "public",
                table: "detail_peserta",
                constraint: "detail_peserta_organisasi_id_fkey",
                kind: "foreignKey",
            }),
            this.dropConstraint({
                schema: "public",
                table: "detail_peserta",
                constraint: "detail_peserta_user_id_fkey",
                kind: "foreignKey",
            }),
            this.dropIndex({
                schema: "public",
                table: "detail_peserta",
                index: "detail_peserta_organisasi_id_idx_2f5facc4",
            }),
            this.dropColumn({ schema: "public", table: "detail_peserta", column: "organisasi_id" }),
            this.dropIndex({
                schema: "public",
                table: "detail_peserta",
                index: "detail_peserta_user_id_idx_6c952402",
            }),
            this.dropColumn({ schema: "public", table: "detail_peserta", column: "user_id" }),
            this.dropColumn({ schema: "public", table: "keuangan", column: "total" }),
            this.dropTable({ schema: "public", table: "log" }),
            this.createTable({
                schema: "public",
                table: "transaction_ledger",
                columns: [
                    col("createdAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("id", "text", { notNull: true, codecRef: { codecId: "pg/text@1" } }),
                    col("keuangan_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("nominal", "numeric", {
                        notNull: true,
                        codecRef: { codecId: "pg/numeric@1" },
                    }),
                    col("organisasi_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("system_details", "text", { codecRef: { codecId: "pg/text@1" } }),
                    col("tipe", "text", { notNull: true, codecRef: { codecId: "pg/text@1" } }),
                    col("user_id", "int4", { notNull: true, codecRef: { codecId: "pg/int4@1" } }),
                ],
                constraints: [
                    primaryKey(["id"]),
                    checkExpression(
                        "transaction_ledger_tipe_check_f766c1dc",
                        `"tipe" IN ('DEBIT', 'KREDIT')`,
                    ),
                ],
            }),
            this.addColumn({
                schema: "public",
                table: "keuangan_detail",
                column: col("createdAt", "timestamptz", {
                    notNull: true,
                    default: fn("now()"),
                    codecRef: { codecId: "pg/timestamptz-string@1" },
                }),
            }),
            this.addColumn({
                schema: "public",
                table: "keuangan_detail",
                column: col("deletedAt", "timestamptz", {
                    codecRef: { codecId: "pg/timestamptz-string@1" },
                }),
            }),
            this.addColumn({
                schema: "public",
                table: "keuangan_detail",
                column: col("updatedAt", "timestamptz", {
                    notNull: true,
                    default: fn("now()"),
                    codecRef: { codecId: "pg/timestamptz-string@1" },
                }),
            }),
            this.addColumn({
                schema: "public",
                table: "peserta",
                column: col("jenis", "text", { codecRef: { codecId: "pg/text@1" } }),
            }),
            this.dataTransform(contract, "backfill-peserta-jenis", {
                check: () => placeholder("backfill-peserta-jenis:check"),
                run: () => placeholder("backfill-peserta-jenis:run"),
            }),
            this.setNotNull({ schema: "public", table: "peserta", column: "jenis" }),
            this.createIndex({
                schema: "public",
                table: "transaction_ledger",
                index: "transaction_ledger_keuangan_id_idx_8badb741",
                columns: ["keuangan_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "transaction_ledger",
                index: "transaction_ledger_organisasi_id_idx_2f5facc4",
                columns: ["organisasi_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "transaction_ledger",
                index: "transaction_ledger_user_id_idx_6c952402",
                columns: ["user_id"],
            }),
            this.addForeignKey({
                schema: "public",
                table: "transaction_ledger",
                foreignKey: {
                    name: "transaction_ledger_keuangan_id_fkey",
                    columns: ["keuangan_id"],
                    references: { schema: "public", table: "keuangan", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "transaction_ledger",
                foreignKey: {
                    name: "transaction_ledger_organisasi_id_fkey",
                    columns: ["organisasi_id"],
                    references: { schema: "public", table: "organisasi", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "transaction_ledger",
                foreignKey: {
                    name: "transaction_ledger_user_id_fkey",
                    columns: ["user_id"],
                    references: { schema: "public", table: "user", columns: ["id"] },
                },
            }),
        ]
    }
}

MigrationCLI.run(import.meta.url, M)
