import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create user_mfa table
  await db.schema
    .createTable('user_mfa')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_uuid_v7()`),
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').onDelete('cascade').notNull(),
    )
    .addColumn('method', 'varchar(50)', (col) =>
      col.notNull().defaultTo('totp'),
    )
    .addColumn('secret', 'varchar(255)', (col) => col)
    .addColumn('enabled', 'boolean', (col) => col.defaultTo(false))
    .addColumn('backup_codes', sql`text[]`, (col) => col)
    .addColumn('workspace_id', 'uuid', (col) =>
      col.references('workspaces.id').onDelete('cascade').notNull(),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addUniqueConstraint('user_mfa_user_id_unique', ['user_id'])
    .execute();

  // Add MFA policy columns to workspaces
  await db.schema
    .alterTable('workspaces')
    .addColumn('mfa_required', 'boolean', (col) => col.defaultTo(false))
    .addColumn('mfa_allowed_methods', sql`text[]`, (col) =>
      col.defaultTo(sql`ARRAY['totp']::text[]`),
    )
    .execute();

  // Create index for user_mfa
  await db.schema
    .createIndex('idx_user_mfa_workspace_id')
    .on('user_mfa')
    .column('workspace_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop index
  await db.schema.dropIndex('idx_user_mfa_workspace_id').execute();

  // Drop MFA columns from workspaces
  await db.schema
    .alterTable('workspaces')
    .dropColumn('mfa_required')
    .dropColumn('mfa_allowed_methods')
    .execute();

  // Drop user_mfa table
  await db.schema.dropTable('user_mfa').execute();
}
