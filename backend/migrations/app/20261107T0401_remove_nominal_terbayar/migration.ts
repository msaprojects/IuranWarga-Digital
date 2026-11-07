#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/be22093153160a087703378d87173869d825f5fcd6b7c4094810176f54c90ae3/contract';
import startContract from '../../snapshots/be22093153160a087703378d87173869d825f5fcd6b7c4094810176f54c90ae3/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f7376ffbe182d084c288251ce384a710f24de8ffb650284535581468e9ee8e15/contract';
import endContract from '../../snapshots/f7376ffbe182d084c288251ce384a710f24de8ffb650284535581468e9ee8e15/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'tagihan_iuran', column: 'nominal_terbayar' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
