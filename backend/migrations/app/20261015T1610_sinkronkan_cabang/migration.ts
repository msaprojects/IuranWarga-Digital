#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/b91facef108961a81d276152c1971c449069e8ab96dcea615314fa4149a091bf/contract';
import startContract from '../../snapshots/b91facef108961a81d276152c1971c449069e8ab96dcea615314fa4149a091bf/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/fcb61b6a6c410d1204295cb853b4a96b2d7d6f59a85e9494b9ec74582deccf2f/contract';
import endContract from '../../snapshots/fcb61b6a6c410d1204295cb853b4a96b2d7d6f59a85e9494b9ec74582deccf2f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'organisasi',
        column: col('contact', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'organisasi',
        column: col('email', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('contact', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('email', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('isActive', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'organisasi',
        constraint: 'organisasi_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_contact_key',
        columns: ['contact'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_email_key',
        columns: ['email'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
