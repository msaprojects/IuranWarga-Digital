#!/usr/bin/env -S node
import type { Contract as End } from "../../snapshots/dd12f658e72e7c21ac0831949f212bd4c9c1de8479535c7a1b847fde0ee13f85/contract";
import endContract from "../../snapshots/dd12f658e72e7c21ac0831949f212bd4c9c1de8479535c7a1b847fde0ee13f85/contract.json" with { type: "json" };
import {
    Migration,
    MigrationCLI,
    checkExpression,
    col,
    fn,
    lit,
    primaryKey,
} from "@prisma/orm-postgres/migration";

export default class M extends Migration<never, End> {
    override readonly endContractJson = endContract;

    override get operations() {
        return [
            this.createSchema({ schema: "public" }),
            this.createTable({
                schema: "public",
                table: "detail_peserta",
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
                    col("nama", "text", { notNull: true, codecRef: { codecId: "pg/text@1" } }),
                    col("organisasi_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("peserta_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("status_keluarga", "text", {
                        notNull: true,
                        codecRef: { codecId: "pg/text@1" },
                    }),
                    col("updatedAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("user_id", "int4", { codecRef: { codecId: "pg/int4@1" } }),
                ],
                constraints: [
                    primaryKey(["id"]),
                    checkExpression(
                        "detail_peserta_status_keluarga_check_29afe047",
                        `"status_keluarga" IN ('KEPALA_KELUARGA', 'SUAMI', 'ISTRI', 'ANAK', 'ORANG_TUA', 'LAINNYA')`,
                    ),
                ],
            }),
            this.createTable({
                schema: "public",
                table: "jenis_iuran",
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
                    col("judul", "text", { notNull: true, codecRef: { codecId: "pg/text@1" } }),
                    col("nominal", "numeric", {
                        notNull: true,
                        codecRef: { codecId: "pg/numeric@1" },
                    }),
                    col("organisasi_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("periode_iuran", "text", {
                        notNull: true,
                        codecRef: { codecId: "pg/text@1" },
                    }),
                    col("tanggal_akhir", "date", {
                        notNull: true,
                        codecRef: { codecId: "pg/date-temporal@1" },
                    }),
                    col("tanggal_awal", "date", {
                        notNull: true,
                        codecRef: { codecId: "pg/date-temporal@1" },
                    }),
                    col("updatedAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                ],
                constraints: [
                    primaryKey(["id"]),
                    checkExpression(
                        "jenis_iuran_periode_iuran_check_cfb06890",
                        `"periode_iuran" IN ('HARIAN', 'MINGGUAN', 'BULANAN', 'TAHUNAN')`,
                    ),
                ],
            }),
            this.createTable({
                schema: "public",
                table: "keuangan",
                columns: [
                    col("createdAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("id", "SERIAL", { notNull: true, codecRef: { codecId: "pg/int4@1" } }),
                    col("jenis_keuangan", "text", {
                        notNull: true,
                        codecRef: { codecId: "pg/text@1" },
                    }),
                    col("keterangan", "text", { codecRef: { codecId: "pg/text@1" } }),
                    col("organisasi_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("tanggal", "date", {
                        notNull: true,
                        codecRef: { codecId: "pg/date-temporal@1" },
                    }),
                    col("total", "numeric", {
                        notNull: true,
                        codecRef: { codecId: "pg/numeric@1" },
                    }),
                    col("updatedAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("user_id", "int4", { codecRef: { codecId: "pg/int4@1" } }),
                ],
                constraints: [
                    primaryKey(["id"]),
                    checkExpression(
                        "keuangan_jenis_keuangan_check_6e72836c",
                        `"jenis_keuangan" IN ('PEMASUKAN', 'PENGELUARAN')`,
                    ),
                ],
            }),
            this.createTable({
                schema: "public",
                table: "keuangan_detail",
                columns: [
                    col("id", "SERIAL", { notNull: true, codecRef: { codecId: "pg/int4@1" } }),
                    col("keterangan", "text", { codecRef: { codecId: "pg/text@1" } }),
                    col("keuangan_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("nominal", "numeric", {
                        notNull: true,
                        codecRef: { codecId: "pg/numeric@1" },
                    }),
                    col("pembayaran_iuran_id", "int4", { codecRef: { codecId: "pg/int4@1" } }),
                ],
                constraints: [primaryKey(["id"])],
            }),
            this.createTable({
                schema: "public",
                table: "log",
                columns: [
                    col("action", "text", { notNull: true, codecRef: { codecId: "pg/text@1" } }),
                    col("createdAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("entity", "text", { codecRef: { codecId: "pg/text@1" } }),
                    col("entity_id", "int4", { codecRef: { codecId: "pg/int4@1" } }),
                    col("id", "SERIAL", { notNull: true, codecRef: { codecId: "pg/int4@1" } }),
                    col("keterangan", "text", { codecRef: { codecId: "pg/text@1" } }),
                    col("metadata", "json", { codecRef: { codecId: "pg/json@1" } }),
                    col("organisasi_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("user_id", "int4", { codecRef: { codecId: "pg/int4@1" } }),
                ],
                constraints: [primaryKey(["id"])],
            }),
            this.createTable({
                schema: "public",
                table: "organisasi",
                columns: [
                    col("alamat", "text", { codecRef: { codecId: "pg/text@1" } }),
                    col("createdAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("id", "SERIAL", { notNull: true, codecRef: { codecId: "pg/int4@1" } }),
                    col("kode", "text", { notNull: true, codecRef: { codecId: "pg/text@1" } }),
                    col("nama", "text", { notNull: true, codecRef: { codecId: "pg/text@1" } }),
                    col("updatedAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("website", "text", { codecRef: { codecId: "pg/text@1" } }),
                ],
                constraints: [primaryKey(["id"])],
            }),
            this.createTable({
                schema: "public",
                table: "pembayaran_iuran",
                columns: [
                    col("createdAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("id", "SERIAL", { notNull: true, codecRef: { codecId: "pg/int4@1" } }),
                    col("jenis_iuran_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("nominal_bayar", "numeric", {
                        notNull: true,
                        codecRef: { codecId: "pg/numeric@1" },
                    }),
                    col("nomor_transaksi", "text", {
                        notNull: true,
                        codecRef: { codecId: "pg/text@1" },
                    }),
                    col("organisasi_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("peserta_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("postedAt", "timestamptz", {
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("status", "text", { notNull: true, codecRef: { codecId: "pg/text@1" } }),
                    col("tagihan_iuran_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("tanggal_bayar", "date", {
                        notNull: true,
                        codecRef: { codecId: "pg/date-temporal@1" },
                    }),
                    col("updatedAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("user_id", "int4", { codecRef: { codecId: "pg/int4@1" } }),
                ],
                constraints: [
                    primaryKey(["id"]),
                    checkExpression(
                        "pembayaran_iuran_status_check_39761ed0",
                        `"status" IN ('BERHASIL', 'CANCELLED', 'REFUNDED')`,
                    ),
                ],
            }),
            this.createTable({
                schema: "public",
                table: "peserta",
                columns: [
                    col("alamat", "text", { notNull: true, codecRef: { codecId: "pg/text@1" } }),
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
                    col("kode", "text", { notNull: true, codecRef: { codecId: "pg/text@1" } }),
                    col("nomor_kk", "text", { codecRef: { codecId: "pg/text@1" } }),
                    col("nomor_rumah", "text", { codecRef: { codecId: "pg/text@1" } }),
                    col("organisasi_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("qr_token", "text", { codecRef: { codecId: "pg/text@1" } }),
                    col("updatedAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("user_id", "int4", { codecRef: { codecId: "pg/int4@1" } }),
                ],
                constraints: [primaryKey(["id"])],
            }),
            this.createTable({
                schema: "public",
                table: "tagihan_iuran",
                columns: [
                    col("bulan", "int4", { codecRef: { codecId: "pg/int4@1" } }),
                    col("createdAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("id", "SERIAL", { notNull: true, codecRef: { codecId: "pg/int4@1" } }),
                    col("jenis_iuran_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("keterangan", "text", { codecRef: { codecId: "pg/text@1" } }),
                    col("nominal_tagihan", "numeric", {
                        notNull: true,
                        codecRef: { codecId: "pg/numeric@1" },
                    }),
                    col("nominal_terbayar", "numeric", {
                        notNull: true,
                        codecRef: { codecId: "pg/numeric@1" },
                    }),
                    col("nomor_tagihan", "text", {
                        notNull: true,
                        codecRef: { codecId: "pg/text@1" },
                    }),
                    col("organisasi_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("peserta_id", "int4", {
                        notNull: true,
                        codecRef: { codecId: "pg/int4@1" },
                    }),
                    col("status", "text", { notNull: true, codecRef: { codecId: "pg/text@1" } }),
                    col("tahun", "int4", { notNull: true, codecRef: { codecId: "pg/int4@1" } }),
                    col("tanggal_jatuh_tempo", "date", {
                        notNull: true,
                        codecRef: { codecId: "pg/date-temporal@1" },
                    }),
                    col("tanggal_terbit", "date", {
                        notNull: true,
                        codecRef: { codecId: "pg/date-temporal@1" },
                    }),
                    col("updatedAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                ],
                constraints: [
                    primaryKey(["id"]),
                    checkExpression(
                        "tagihan_iuran_status_check_7f92ac25",
                        `"status" IN ('BELUM_BAYAR', 'PARTIAL', 'SUDAH_BAYAR', 'OVERDUE', 'CANCELLED')`,
                    ),
                ],
            }),
            this.createTable({
                schema: "public",
                table: "user",
                columns: [
                    col("createdAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("id", "SERIAL", { notNull: true, codecRef: { codecId: "pg/int4@1" } }),
                    col("latestLogin", "timestamptz", {
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("name", "text", { codecRef: { codecId: "pg/text@1" } }),
                    col("organisasi_id", "int4", { codecRef: { codecId: "pg/int4@1" } }),
                    col("password", "text", { notNull: true, codecRef: { codecId: "pg/text@1" } }),
                    col("role", "text", { notNull: true, codecRef: { codecId: "pg/text@1" } }),
                    col("updatedAt", "timestamptz", {
                        notNull: true,
                        default: fn("now()"),
                        codecRef: { codecId: "pg/timestamptz-string@1" },
                    }),
                    col("username", "text", { notNull: true, codecRef: { codecId: "pg/text@1" } }),
                ],
                constraints: [
                    primaryKey(["id"]),
                    checkExpression(
                        "user_role_check_a8bee70d",
                        `"role" IN ('USER', 'ADMIN', 'SUPER_ADMIN')`,
                    ),
                ],
            }),
            this.addUnique({
                schema: "public",
                table: "organisasi",
                constraint: "organisasi_kode_key",
                columns: ["kode"],
            }),
            this.addUnique({
                schema: "public",
                table: "pembayaran_iuran",
                constraint: "pembayaran_iuran_nomor_transaksi_key",
                columns: ["nomor_transaksi"],
            }),
            this.addUnique({
                schema: "public",
                table: "peserta",
                constraint: "peserta_qr_token_key",
                columns: ["qr_token"],
            }),
            this.addUnique({
                schema: "public",
                table: "peserta",
                constraint: "peserta_organisasi_id_kode_key",
                columns: ["organisasi_id", "kode"],
            }),
            this.addUnique({
                schema: "public",
                table: "tagihan_iuran",
                constraint: "tagihan_iuran_nomor_tagihan_key",
                columns: ["nomor_tagihan"],
            }),
            this.addUnique({
                schema: "public",
                table: "tagihan_iuran",
                constraint: "tagihan_iuran_peserta_id_jenis_iuran_id_tahun_bulan_key",
                columns: ["peserta_id", "jenis_iuran_id", "tahun", "bulan"],
            }),
            this.addUnique({
                schema: "public",
                table: "user",
                constraint: "user_username_key",
                columns: ["username"],
            }),
            this.createIndex({
                schema: "public",
                table: "detail_peserta",
                index: "detail_peserta_isActive_idx_77fe3ba1",
                columns: ["isActive"],
            }),
            this.createIndex({
                schema: "public",
                table: "detail_peserta",
                index: "detail_peserta_organisasi_id_idx_2f5facc4",
                columns: ["organisasi_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "detail_peserta",
                index: "detail_peserta_peserta_id_idx_52c9abf0",
                columns: ["peserta_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "detail_peserta",
                index: "detail_peserta_user_id_idx_6c952402",
                columns: ["user_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "jenis_iuran",
                index: "jenis_iuran_isActive_idx_77fe3ba1",
                columns: ["isActive"],
            }),
            this.createIndex({
                schema: "public",
                table: "jenis_iuran",
                index: "jenis_iuran_organisasi_id_idx_2f5facc4",
                columns: ["organisasi_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "jenis_iuran",
                index: "jenis_iuran_periode_iuran_idx_1ac5fae9",
                columns: ["periode_iuran"],
            }),
            this.createIndex({
                schema: "public",
                table: "keuangan",
                index: "keuangan_jenis_keuangan_idx_6aaac0de",
                columns: ["jenis_keuangan"],
            }),
            this.createIndex({
                schema: "public",
                table: "keuangan",
                index: "keuangan_organisasi_id_idx_2f5facc4",
                columns: ["organisasi_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "keuangan",
                index: "keuangan_tanggal_idx_9e863ca6",
                columns: ["tanggal"],
            }),
            this.createIndex({
                schema: "public",
                table: "keuangan",
                index: "keuangan_user_id_idx_6c952402",
                columns: ["user_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "keuangan_detail",
                index: "keuangan_detail_keuangan_id_idx_8badb741",
                columns: ["keuangan_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "keuangan_detail",
                index: "keuangan_detail_pembayaran_iuran_id_idx_1169ed50",
                columns: ["pembayaran_iuran_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "log",
                index: "log_action_idx_cd0d2116",
                columns: ["action"],
            }),
            this.createIndex({
                schema: "public",
                table: "log",
                index: "log_createdAt_idx_9575dbd7",
                columns: ["createdAt"],
            }),
            this.createIndex({
                schema: "public",
                table: "log",
                index: "log_entity_entity_id_idx_6c9a2949",
                columns: ["entity", "entity_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "log",
                index: "log_organisasi_id_idx_2f5facc4",
                columns: ["organisasi_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "log",
                index: "log_user_id_idx_6c952402",
                columns: ["user_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "organisasi",
                index: "organisasi_nama_idx_5f059ccb",
                columns: ["nama"],
            }),
            this.createIndex({
                schema: "public",
                table: "pembayaran_iuran",
                index: "pembayaran_iuran_jenis_iuran_id_idx_3ca5ef71",
                columns: ["jenis_iuran_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "pembayaran_iuran",
                index: "pembayaran_iuran_organisasi_id_idx_2f5facc4",
                columns: ["organisasi_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "pembayaran_iuran",
                index: "pembayaran_iuran_peserta_id_idx_52c9abf0",
                columns: ["peserta_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "pembayaran_iuran",
                index: "pembayaran_iuran_status_idx_e98638ab",
                columns: ["status"],
            }),
            this.createIndex({
                schema: "public",
                table: "pembayaran_iuran",
                index: "pembayaran_iuran_tagihan_iuran_id_idx_59d5be71",
                columns: ["tagihan_iuran_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "pembayaran_iuran",
                index: "pembayaran_iuran_tanggal_bayar_idx_b85c889b",
                columns: ["tanggal_bayar"],
            }),
            this.createIndex({
                schema: "public",
                table: "pembayaran_iuran",
                index: "pembayaran_iuran_user_id_idx_6c952402",
                columns: ["user_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "peserta",
                index: "peserta_isActive_idx_77fe3ba1",
                columns: ["isActive"],
            }),
            this.createIndex({
                schema: "public",
                table: "peserta",
                index: "peserta_nomor_rumah_idx_3d896545",
                columns: ["nomor_rumah"],
            }),
            this.createIndex({
                schema: "public",
                table: "peserta",
                index: "peserta_organisasi_id_idx_2f5facc4",
                columns: ["organisasi_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "peserta",
                index: "peserta_user_id_idx_6c952402",
                columns: ["user_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "tagihan_iuran",
                index: "tagihan_iuran_jenis_iuran_id_idx_3ca5ef71",
                columns: ["jenis_iuran_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "tagihan_iuran",
                index: "tagihan_iuran_organisasi_id_idx_2f5facc4",
                columns: ["organisasi_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "tagihan_iuran",
                index: "tagihan_iuran_peserta_id_idx_52c9abf0",
                columns: ["peserta_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "tagihan_iuran",
                index: "tagihan_iuran_status_idx_e98638ab",
                columns: ["status"],
            }),
            this.createIndex({
                schema: "public",
                table: "tagihan_iuran",
                index: "tagihan_iuran_tahun_bulan_idx_bc66ba83",
                columns: ["tahun", "bulan"],
            }),
            this.createIndex({
                schema: "public",
                table: "tagihan_iuran",
                index: "tagihan_iuran_tanggal_jatuh_tempo_idx_f7559409",
                columns: ["tanggal_jatuh_tempo"],
            }),
            this.createIndex({
                schema: "public",
                table: "user",
                index: "user_organisasi_id_idx_2f5facc4",
                columns: ["organisasi_id"],
            }),
            this.createIndex({
                schema: "public",
                table: "user",
                index: "user_role_idx_2c1ddf83",
                columns: ["role"],
            }),
            this.addForeignKey({
                schema: "public",
                table: "detail_peserta",
                foreignKey: {
                    name: "detail_peserta_peserta_id_fkey",
                    columns: ["peserta_id"],
                    references: { schema: "public", table: "peserta", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "detail_peserta",
                foreignKey: {
                    name: "detail_peserta_user_id_fkey",
                    columns: ["user_id"],
                    references: { schema: "public", table: "user", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "detail_peserta",
                foreignKey: {
                    name: "detail_peserta_organisasi_id_fkey",
                    columns: ["organisasi_id"],
                    references: { schema: "public", table: "organisasi", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "jenis_iuran",
                foreignKey: {
                    name: "jenis_iuran_organisasi_id_fkey",
                    columns: ["organisasi_id"],
                    references: { schema: "public", table: "organisasi", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "keuangan",
                foreignKey: {
                    name: "keuangan_organisasi_id_fkey",
                    columns: ["organisasi_id"],
                    references: { schema: "public", table: "organisasi", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "keuangan",
                foreignKey: {
                    name: "keuangan_user_id_fkey",
                    columns: ["user_id"],
                    references: { schema: "public", table: "user", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "keuangan_detail",
                foreignKey: {
                    name: "keuangan_detail_keuangan_id_fkey",
                    columns: ["keuangan_id"],
                    references: { schema: "public", table: "keuangan", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "keuangan_detail",
                foreignKey: {
                    name: "keuangan_detail_pembayaran_iuran_id_fkey",
                    columns: ["pembayaran_iuran_id"],
                    references: { schema: "public", table: "pembayaran_iuran", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "log",
                foreignKey: {
                    name: "log_organisasi_id_fkey",
                    columns: ["organisasi_id"],
                    references: { schema: "public", table: "organisasi", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "log",
                foreignKey: {
                    name: "log_user_id_fkey",
                    columns: ["user_id"],
                    references: { schema: "public", table: "user", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "pembayaran_iuran",
                foreignKey: {
                    name: "pembayaran_iuran_organisasi_id_fkey",
                    columns: ["organisasi_id"],
                    references: { schema: "public", table: "organisasi", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "pembayaran_iuran",
                foreignKey: {
                    name: "pembayaran_iuran_tagihan_iuran_id_fkey",
                    columns: ["tagihan_iuran_id"],
                    references: { schema: "public", table: "tagihan_iuran", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "pembayaran_iuran",
                foreignKey: {
                    name: "pembayaran_iuran_jenis_iuran_id_fkey",
                    columns: ["jenis_iuran_id"],
                    references: { schema: "public", table: "jenis_iuran", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "pembayaran_iuran",
                foreignKey: {
                    name: "pembayaran_iuran_peserta_id_fkey",
                    columns: ["peserta_id"],
                    references: { schema: "public", table: "peserta", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "pembayaran_iuran",
                foreignKey: {
                    name: "pembayaran_iuran_user_id_fkey",
                    columns: ["user_id"],
                    references: { schema: "public", table: "user", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "peserta",
                foreignKey: {
                    name: "peserta_organisasi_id_fkey",
                    columns: ["organisasi_id"],
                    references: { schema: "public", table: "organisasi", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "peserta",
                foreignKey: {
                    name: "peserta_user_id_fkey",
                    columns: ["user_id"],
                    references: { schema: "public", table: "user", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "tagihan_iuran",
                foreignKey: {
                    name: "tagihan_iuran_organisasi_id_fkey",
                    columns: ["organisasi_id"],
                    references: { schema: "public", table: "organisasi", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "tagihan_iuran",
                foreignKey: {
                    name: "tagihan_iuran_jenis_iuran_id_fkey",
                    columns: ["jenis_iuran_id"],
                    references: { schema: "public", table: "jenis_iuran", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "tagihan_iuran",
                foreignKey: {
                    name: "tagihan_iuran_peserta_id_fkey",
                    columns: ["peserta_id"],
                    references: { schema: "public", table: "peserta", columns: ["id"] },
                },
            }),
            this.addForeignKey({
                schema: "public",
                table: "user",
                foreignKey: {
                    name: "user_organisasi_id_fkey",
                    columns: ["organisasi_id"],
                    references: { schema: "public", table: "organisasi", columns: ["id"] },
                },
            }),
        ];
    }
}

MigrationCLI.run(import.meta.url, M);
