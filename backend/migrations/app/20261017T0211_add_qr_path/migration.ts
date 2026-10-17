#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/12215829162ad2ef221fbb9afd3da0aa8545beaec7069888bf915192a643b2a0/contract';
import startContract from '../../snapshots/12215829162ad2ef221fbb9afd3da0aa8545beaec7069888bf915192a643b2a0/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/797d9ef55d08c27cfcabfd60e5326bb1097e60ad07909209b1f8d673d125ddb1/contract';
import endContract from '../../snapshots/797d9ef55d08c27cfcabfd60e5326bb1097e60ad07909209b1f8d673d125ddb1/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'peserta', column: 'jenis' }),
      this.dropColumn({ schema: 'public', table: 'peserta', column: 'nomor_kk' }),
      this.addColumn({
        schema: 'public',
        table: 'peserta',
        column: col('nama', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'peserta',
        column: col('qr_path', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dropNotNull({ schema: 'public', table: 'peserta', column: 'alamat' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
