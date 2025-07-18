import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Index for efficient trash queries
  await db.schema
    .createIndex('idx_pages_deleted_at')
    .on('pages')
    .column('deleted_at')
    .where('deleted_at', 'is not', null)
    .execute();

  // Composite index for workspace-specific trash queries
  await db.schema
    .createIndex('idx_pages_workspace_deleted')
    .on('pages')
    .columns(['workspace_id', 'deleted_at'])
    .where('deleted_at', 'is not', null)
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_pages_workspace_deleted').execute();
  await db.schema.dropIndex('idx_pages_deleted_at').execute();
}