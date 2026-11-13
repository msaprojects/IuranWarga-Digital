#!/usr/bin/env -S node
import type { Contract as End } from "../../snapshots/03d85652ff884714f996711ae377ed90f053d506fc8dd95d19fbdc2d1b582dd9/contract"
import endContract from "../../snapshots/03d85652ff884714f996711ae377ed90f053d506fc8dd95d19fbdc2d1b582dd9/contract.json" with { type: "json" }
import type { Contract as Start } from "../../snapshots/f7376ffbe182d084c288251ce384a710f24de8ffb650284535581468e9ee8e15/contract"
import startContract from "../../snapshots/f7376ffbe182d084c288251ce384a710f24de8ffb650284535581468e9ee8e15/contract.json" with { type: "json" }
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from "@prisma/orm-postgres/migration"

export default class M extends Migration<Start, End> {
    override readonly startContractJson = startContract
    override readonly endContractJson = endContract

    override get operations() {
        return [
            this.dropIndex({
                schema: "public",
                table: "tagihan_iuran",
                index: "tagihan_iuran_status_idx_e98638ab",
            }),
            this.dropIndex({
                schema: "public",
                table: "tagihan_iuran",
                index: "tagihan_iuran_tahun_bulan_idx_bc66ba83",
            }),
            this.createTable({
                schema: "public",
                table: "anggota_sub_organisasi",
                columns: [
                    col("createdAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("id", "SERIAL", { notNull: true, codecRef: { codecId: "pg/int4@1" } }),
                    col("isActive", "bool", {
                        notNull: true,
                        default: lit(true),
                        codecRef: { codecId: "pg/bool@1" },
                    }),
                    col("peserta_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("sub_organisasi_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("updatedAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                ],
                constraints: [primaryKey(["id"])],
            }),
            this.createTable({
                schema: "public",
                table: "komponen_sub_organisasi",
                columns: [
                    col("createdAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("id", "SERIAL", { notNull: true, codecRef: { codecId: "pg/int4@1" } }),
                    col("isActive", "bool", {
                        notNull: true,
                        default: lit(true),
                        codecRef: { codecId: "pg/bool@1" },
                    }),
                    col("jenis_iuran_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("nominal", "numeric", {
                        notNull: true,
                        codecRef: { codecId: "pg/numeric@1" },
                    }),
                    col("sub_organisasi_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("updatedAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                ],
                constraints: [primaryKey(["id"])],
            }),
            this.createTable({
                schema: "public",
                table: "pengurus_sub_organisasi",
                columns: [
                    col("createdAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("id", "SERIAL", { notNull: true, codecRef: { codecId: "pg/int4@1" } }),
                    col("isActive", "bool", {
                        notNull: true,
                        default: lit(true),
                        codecRef: { codecId: "pg/bool@1" },
                    }),
                    col("jabatan", "text", { notNull: true, codecRef: { codecId: "pg/text@1" } }),
                    col("sub_organisasi_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("updatedAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("user_id", "int4", { notNull: true, codecRef: { codecId: "pg/int4@1" } }),
                ],
                constraints: [primaryKey(["id"])],
            }),
            this.createTable({
                schema: "public",
                table: "sub_organisasi",
                columns: [
                    col("createdAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("deskripsi", "text", { codecRef: { codecId: "pg/text@1" } }),
                    col("id", "SERIAL", { notNull: true, codecRef: { codecId: "pg/int4@1" } }),
                    col("isActive", "bool", {
                        notNull: true,
                        default: lit(true),
                        codecRef: { codecId: "pg/bool@1" },
                    }),
                    col("nama", "text", { notNull: true, codecRef: { codecId: "pg/text@1" } }),
                    col("organisasi_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("pisah_laporan", "bool", {
                        notNull: true,
                        default: lit(false),
                        codecRef: { codecId: "pg/bool@1" },
                    }),
                    col("updatedAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                ],
                constraints: [primaryKey(["id"])],
            }),
            this.addColumn({
                schema: "public",
                table: "tagihan_iuran",
                column: col("sub_organisasi_id", "int4", { codecRef: { codecId: "pg/int4@1" } }),
            }),
            this.addColumn({
                schema: "public",
                table: "transaction_ledger",
                column: col("sub_organisasi_id", "int4", { codecRef: { codecId: "pg/int4@1" } }),
            }),
            this.dropNotNull({ schema: "public", table: "transaction_ledger", column: "user_id" }),
            this.addUnique({
                schema: "public",
                table: "anggota_sub_organisasi",
                constraint: "anggota_sub_organisasi_sub_organisasi_id_peserta_id_key",
                columns: ["sub_organisasi_id", "peserta_id"],
            }),
            this.addUnique({
                schema: "public",
                table: "jenis_iuran",
                constraint: "jenis_iuran_organisasi_id_judul_key",
                columns: ["organisasi_id", "judul"],
            }),
            this.addUnique({
                schema: "public",
                table: "komponen_sub_organisasi",
                constraint: "komponen_sub_organisasi_sub_organisasi_id_jenis_iuran_id_key",
                columns: ["sub_organisasi_id", "jenis_iuran_id"],
            }),
            this.addUnique({
                schema: "public",
                table: "pengurus_sub_organisasi",
                constraint: "pengurus_sub_organisasi_sub_organisasi_id_user_id_key",
                columns: ["sub_organisasi_id", "user_id"],
            }),
            this.addUnique({
                schema: "public",
                table: "sub_organisasi",
                constraint: "sub_organisasi_organisasi_id_nama_key",
                columns: ["organisasi_id", "nama"],
            }),
            this.createIndex({
                schema: "public",
                table: "anggota_sub_organisasi",
                index: "anggota_sub_organisasi_peserta_id_idx_52c9abf0",
                columns: ["peserta_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "anggota_sub_organisasi",
                index: "anggota_sub_organisasi_sub_organisasi_id_idx_8f7c5a0e",
                columns: ["sub_organisasi_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "komponen_sub_organisasi",
                index: "komponen_sub_organisasi_jenis_iuran_id_idx_3ca5ef71",
                columns: ["jenis_iuran_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "komponen_sub_organisasi",
                index: "komponen_sub_organisasi_sub_organisasi_id_idx_8f7c5a0e",
                columns: ["sub_organisasi_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "pengurus_sub_organisasi",
                index: "pengurus_sub_organisasi_sub_organisasi_id_idx_8f7c5a0e",
                columns: ["sub_organisasi_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "pengurus_sub_organisasi",
                index: "pengurus_sub_organisasi_user_id_idx_6c952402",
                columns: ["user_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "sub_organisasi",
                index: "sub_organisasi_isActive_idx_77fe3ba1",
                columns: ["isActive"],
            }),
            this.createIndex({
                schema: "public",
                table: "sub_organisasi",
                index: "sub_organisasi_organisasi_id_idx_2f5facc4",
                columns: ["organisasi_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "tagihan_iuran",
                index: "tagihan_iuran_deletedAt_idx_a39f721c",
                columns: ["deletedAt"],
            }),
            this.createIndex({
                schema: "public",
                table: "tagihan_iuran",
                index: "tagihan_iuran_deletedBy_idx_4d24a1c3",
                columns: ["deletedBy"],
            }),
            this.createIndex({
                schema: "public",
                table: "tagihan_iuran",
                index: "tagihan_iuran_organisasi_id_status_idx_6301355e",
                columns: ["organisasi_id", "status"],
            }),
            this.createIndex({
                schema: "public",
                table: "tagihan_iuran",
                index: "tagihan_iuran_organisasi_id_tahun_bulan_idx_2e715dee",
                columns: ["organisasi_id", "tahun", "bulan"],
            }),
            this.createIndex({
                schema: "public",
                table: "tagihan_iuran",
                index: "tagihan_iuran_sub_organisasi_id_idx_8f7c5a0e",
                columns: ["sub_organisasi_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "transaction_ledger",
                index: "transaction_ledger_organisasi_id_createdAt_idx_7da82646",
                columns: ["organisasi_id", "createdAt"],
            }),
            this.createIndex({
                schema: "public",
                table: "transaction_ledger",
                index: "transaction_ledger_sub_organisasi_id_idx_8f7c5a0e",
                columns: ["sub_organisasi_id"],
            }),
            this.addForeignKey({
                schema: "public",
                table: "anggota_sub_organisasi",
                foreignKey: {
                    name: "anggota_sub_organisasi_sub_organisasi_id_fkey",
                    columns: ["sub_organisasi_id"],
                    references: { schema: "public", table: "sub_organisasi", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "anggota_sub_organisasi",
                foreignKey: {
                    name: "anggota_sub_organisasi_peserta_id_fkey",
                    columns: ["peserta_id"],
                    references: { schema: "public", table: "peserta", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "komponen_sub_organisasi",
                foreignKey: {
                    name: "komponen_sub_organisasi_sub_organisasi_id_fkey",
                    columns: ["sub_organisasi_id"],
                    references: { schema: "public", table: "sub_organisasi", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "komponen_sub_organisasi",
                foreignKey: {
                    name: "komponen_sub_organisasi_jenis_iuran_id_fkey",
                    columns: ["jenis_iuran_id"],
                    references: { schema: "public", table: "jenis_iuran", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "pengurus_sub_organisasi",
                foreignKey: {
                    name: "pengurus_sub_organisasi_sub_organisasi_id_fkey",
                    columns: ["sub_organisasi_id"],
                    references: { schema: "public", table: "sub_organisasi", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "pengurus_sub_organisasi",
                foreignKey: {
                    name: "pengurus_sub_organisasi_user_id_fkey",
                    columns: ["user_id"],
                    references: { schema: "public", table: "user", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "sub_organisasi",
                foreignKey: {
                    name: "sub_organisasi_organisasi_id_fkey",
                    columns: ["organisasi_id"],
                    references: { schema: "public", table: "organisasi", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "tagihan_iuran",
                foreignKey: {
                    name: "tagihan_iuran_deletedBy_fkey",
                    columns: ["deletedBy"],
                    references: { schema: "public", table: "user", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "tagihan_iuran",
                foreignKey: {
                    name: "tagihan_iuran_sub_organisasi_id_fkey",
                    columns: ["sub_organisasi_id"],
                    references: { schema: "public", table: "sub_organisasi", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "transaction_ledger",
                foreignKey: {
                    name: "transaction_ledger_sub_organisasi_id_fkey",
                    columns: ["sub_organisasi_id"],
                    references: { schema: "public", table: "sub_organisasi", columns: ["id"] },
                },
            }),
        ]
    }
}

MigrationCLI.run(import.meta.url, M)
