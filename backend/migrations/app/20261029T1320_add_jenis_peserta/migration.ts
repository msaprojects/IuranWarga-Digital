#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/797d9ef55d08c27cfcabfd60e5326bb1097e60ad07909209b1f8d673d125ddb1/contract';
import startContract from '../../snapshots/797d9ef55d08c27cfcabfd60e5326bb1097e60ad07909209b1f8d673d125ddb1/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/be22093153160a087703378d87173869d825f5fcd6b7c4094810176f54c90ae3/contract';
import endContract from '../../snapshots/be22093153160a087703378d87173869d825f5fcd6b7c4094810176f54c90ae3/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';
import postgres from '@prisma/orm-postgres/runtime';

const { sql: db, contract } = postgres<End>({ contractJson: endContract });

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'jenis_iuran', column: 'tanggal_akhir' }),
      this.dropColumn({ schema: 'public', table: 'jenis_iuran', column: 'tanggal_awal' }),
      this.dropIndex({
        schema: 'public',
        table: 'tagihan_iuran',
        index: 'tagihan_iuran_tanggal_jatuh_tempo_idx_f7559409',
      }),
      this.dropColumn({ schema: 'public', table: 'tagihan_iuran', column: 'tanggal_jatuh_tempo' }),
      this.addColumn({
        schema: 'public',
        table: 'tagihan_iuran',
        column: col('deletedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'tagihan_iuran',
        column: col('deletedBy', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'tagihan_iuran',
        column: col('deletedDescription', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'jenis_iuran',
        column: col('jenis_peserta', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(contract, 'backfill-jenis_iuran-jenis_peserta', {
        check: () => db.public.jenis_iuran.select('id').where((f, fns) => fns.eq(f.jenis_peserta, null)).limit(1),
        run: () => db.public.jenis_iuran.update({ jenis_peserta: 'RUMAH' }).where((f, fns) => fns.eq(f.jenis_peserta, null)),
      }),
      this.setNotNull({ schema: 'public', table: 'jenis_iuran', column: 'jenis_peserta' }),
      this.addColumn({
        schema: 'public',
        table: 'peserta',
        column: col('jenis_peserta', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(contract, 'backfill-peserta-jenis_peserta', {
        check: () => db.public.peserta.select('id').where((f, fns) => fns.eq(f.jenis_peserta, null)).limit(1),
        run: () => db.public.peserta.update({ jenis_peserta: 'RUMAH' }).where((f, fns) => fns.eq(f.jenis_peserta, null)),
      }),
      this.setNotNull({ schema: 'public', table: 'peserta', column: 'jenis_peserta' }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'jenis_iuran',
        constraint: 'jenis_iuran_jenis_peserta_check_f8e7b57b',
        expression: `"jenis_peserta" IN ('RUMAH', 'KOS', 'TEMPAT_USAHA', 'LAINNYA')`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'peserta',
        constraint: 'peserta_jenis_peserta_check_f8e7b57b',
        expression: `"jenis_peserta" IN ('RUMAH', 'KOS', 'TEMPAT_USAHA', 'LAINNYA')`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
