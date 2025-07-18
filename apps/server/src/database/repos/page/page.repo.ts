import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB, KyselyTransaction } from '../../types/kysely.types';
import { dbOrTx } from '../../utils';
import {
  InsertablePage,
  Page,
  UpdatablePage,
} from '@docmost/db/types/entity.types';
import { PaginationOptions } from '@docmost/db/pagination/pagination-options';
import { executeWithPagination } from '@docmost/db/pagination/pagination';
import { validate as isValidUUID } from 'uuid';
import { ExpressionBuilder, sql } from 'kysely';
import { DB } from '@docmost/db/types/db';
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres';
import { SpaceMemberRepo } from '@docmost/db/repos/space/space-member.repo';

@Injectable()
export class PageRepo {
  constructor(
    @InjectKysely() private readonly db: KyselyDB,
    private spaceMemberRepo: SpaceMemberRepo,
  ) {}

  private baseFields: Array<keyof Page> = [
    'id',
    'slugId',
    'title',
    'icon',
    'coverPhoto',
    'position',
    'parentPageId',
    'creatorId',
    'lastUpdatedById',
    'spaceId',
    'workspaceId',
    'isLocked',
    'createdAt',
    'updatedAt',
    'deletedAt',
    'contributorIds',
  ];

  async findById(
    pageId: string,
    opts?: {
      includeContent?: boolean;
      includeYdoc?: boolean;
      includeSpace?: boolean;
      includeCreator?: boolean;
      includeLastUpdatedBy?: boolean;
      includeContributors?: boolean;
      withLock?: boolean;
      trx?: KyselyTransaction;
    },
  ): Promise<Page> {
    const db = dbOrTx(this.db, opts?.trx);

    let query = db
      .selectFrom('pages')
      .select(this.baseFields)
      .$if(opts?.includeContent, (qb) => qb.select('content'))
      .$if(opts?.includeYdoc, (qb) => qb.select('ydoc'));

    if (opts?.includeCreator) {
      query = query.select((eb) => this.withCreator(eb));
    }

    if (opts?.includeLastUpdatedBy) {
      query = query.select((eb) => this.withLastUpdatedBy(eb));
    }

    if (opts?.includeContributors) {
      query = query.select((eb) => this.withContributors(eb));
    }

    if (opts?.includeSpace) {
      query = query.select((eb) => this.withSpace(eb));
    }

    if (opts?.withLock && opts?.trx) {
      query = query.forUpdate();
    }

    if (isValidUUID(pageId)) {
      query = query.where('id', '=', pageId);
    } else {
      query = query.where('slugId', '=', pageId);
    }

    return query.executeTakeFirst();
  }

  async updatePage(
    updatablePage: UpdatablePage,
    pageId: string,
    trx?: KyselyTransaction,
  ) {
    return this.updatePages(updatablePage, [pageId], trx);
  }

  async updatePages(
    updatePageData: UpdatablePage,
    pageIds: string[],
    trx?: KyselyTransaction,
  ) {
    return dbOrTx(this.db, trx)
      .updateTable('pages')
      .set({ ...updatePageData, updatedAt: new Date() })
      .where(
        pageIds.some((pageId) => !isValidUUID(pageId)) ? 'slugId' : 'id',
        'in',
        pageIds,
      )
      .executeTakeFirst();
  }

  async insertPage(
    insertablePage: InsertablePage,
    trx?: KyselyTransaction,
  ): Promise<Page> {
    const db = dbOrTx(this.db, trx);
    return db
      .insertInto('pages')
      .values(insertablePage)
      .returning(this.baseFields)
      .executeTakeFirst();
  }

  async deletePage(pageId: string): Promise<void> {
    let query = this.db.deleteFrom('pages');

    if (isValidUUID(pageId)) {
      query = query.where('id', '=', pageId);
    } else {
      query = query.where('slugId', '=', pageId);
    }

    await query.execute();
  }

  async getRecentPagesInSpace(spaceId: string, pagination: PaginationOptions) {
    const query = this.db
      .selectFrom('pages')
      .select(this.baseFields)
      .select((eb) => this.withSpace(eb))
      .where('spaceId', '=', spaceId)
      .orderBy('updatedAt', 'desc');

    const result = executeWithPagination(query, {
      page: pagination.page,
      perPage: pagination.limit,
    });

    return result;
  }

  async getRecentPages(userId: string, pagination: PaginationOptions) {
    const userSpaceIds = await this.spaceMemberRepo.getUserSpaceIds(userId);

    const query = this.db
      .selectFrom('pages')
      .select(this.baseFields)
      .select((eb) => this.withSpace(eb))
      .where('spaceId', 'in', userSpaceIds)
      .orderBy('updatedAt', 'desc');

    const hasEmptyIds = userSpaceIds.length === 0;
    const result = executeWithPagination(query, {
      page: pagination.page,
      perPage: pagination.limit,
      hasEmptyIds,
    });

    return result;
  }

  withSpace(eb: ExpressionBuilder<DB, 'pages'>) {
    return jsonObjectFrom(
      eb
        .selectFrom('spaces')
        .select(['spaces.id', 'spaces.name', 'spaces.slug'])
        .whereRef('spaces.id', '=', 'pages.spaceId'),
    ).as('space');
  }

  withCreator(eb: ExpressionBuilder<DB, 'pages'>) {
    return jsonObjectFrom(
      eb
        .selectFrom('users')
        .select(['users.id', 'users.name', 'users.avatarUrl'])
        .whereRef('users.id', '=', 'pages.creatorId'),
    ).as('creator');
  }

  withLastUpdatedBy(eb: ExpressionBuilder<DB, 'pages'>) {
    return jsonObjectFrom(
      eb
        .selectFrom('users')
        .select(['users.id', 'users.name', 'users.avatarUrl'])
        .whereRef('users.id', '=', 'pages.lastUpdatedById'),
    ).as('lastUpdatedBy');
  }

  withContributors(eb: ExpressionBuilder<DB, 'pages'>) {
    return jsonArrayFrom(
      eb
        .selectFrom('users')
        .select(['users.id', 'users.name', 'users.avatarUrl'])
        .whereRef('users.id', '=', sql`ANY(${eb.ref('pages.contributorIds')})`),
    ).as('contributors');
  }

  withDeletedBy(eb: ExpressionBuilder<DB, 'pages'>) {
    return jsonObjectFrom(
      eb
        .selectFrom('users')
        .select(['users.id', 'users.name', 'users.avatarUrl'])
        .whereRef('users.id', '=', 'pages.deletedById'),
    ).as('deletedBy');
  }

  async getPageAndDescendants(
    parentPageId: string,
    opts: { includeContent: boolean },
  ) {
    return this.db
      .withRecursive('page_hierarchy', (db) =>
        db
          .selectFrom('pages')
          .select([
            'id',
            'slugId',
            'title',
            'icon',
            'position',
            'parentPageId',
            'spaceId',
            'workspaceId',
          ])
          .$if(opts?.includeContent, (qb) => qb.select('content'))
          .where('id', '=', parentPageId)
          .unionAll((exp) =>
            exp
              .selectFrom('pages as p')
              .select([
                'p.id',
                'p.slugId',
                'p.title',
                'p.icon',
                'p.position',
                'p.parentPageId',
                'p.spaceId',
                'p.workspaceId',
              ])
              .$if(opts?.includeContent, (qb) => qb.select('p.content'))
              .innerJoin('page_hierarchy as ph', 'p.parentPageId', 'ph.id'),
          ),
      )
      .selectFrom('page_hierarchy')
      .selectAll()
      .execute();
  }

  async softDeletePageAndDescendants(
    pageId: string,
    deletedById: string,
    trx?: KyselyTransaction,
  ): Promise<string[]> {
    const db = dbOrTx(this.db, trx);

    // Get all page IDs that will be soft deleted (page + descendants)
    const pageIds = await db
      .withRecursive('page_tree', (qb) =>
        qb
          .selectFrom('pages')
          .select('id')
          .where('id', '=', pageId)
          .where('deletedAt', 'is', null)
          .unionAll((eb) =>
            eb
              .selectFrom('pages as p')
              .select('p.id')
              .innerJoin('page_tree as pt', 'p.parentPageId', 'pt.id')
              .where('p.deletedAt', 'is', null),
          ),
      )
      .selectFrom('page_tree')
      .select('id')
      .execute();

    const idsToDelete = pageIds.map((p) => p.id);

    if (idsToDelete.length === 0) {
      return [];
    }

    // Soft delete all pages in the tree
    await db
      .updateTable('pages')
      .set({
        deletedAt: new Date(),
        deletedById: deletedById,
        updatedAt: new Date(),
      })
      .where('id', 'in', idsToDelete)
      .execute();

    return idsToDelete;
  }

  async restorePageAndDescendants(
    pageId: string,
    trx?: KyselyTransaction,
  ): Promise<{ detachedFromParent: boolean; restoredPageIds: string[] }> {
    const db = dbOrTx(this.db, trx);

    // Check if parent is deleted
    const page = await this.findById(pageId, { trx });
    if (!page) {
      throw new Error('Page not found');
    }

    let detachedFromParent = false;

    if (page.parentPageId) {
      const parent = await this.findById(page.parentPageId, { trx });
      if (parent?.deletedAt) {
        // Detach from deleted parent
        await db
          .updateTable('pages')
          .set({
            parentPageId: null,
            updatedAt: new Date(),
          })
          .where('id', '=', pageId)
          .execute();
        detachedFromParent = true;
      }
    }

    // Get all page IDs that will be restored (page + descendants)
    const pageIds = await db
      .withRecursive('page_tree', (qb) =>
        qb
          .selectFrom('pages')
          .select('id')
          .where('id', '=', pageId)
          .unionAll((eb) =>
            eb
              .selectFrom('pages as p')
              .select('p.id')
              .innerJoin('page_tree as pt', 'p.parentPageId', 'pt.id')
              .where('p.deletedAt', 'is not', null),
          ),
      )
      .selectFrom('page_tree')
      .select('id')
      .execute();

    const idsToRestore = pageIds.map((p) => p.id);

    if (idsToRestore.length === 0) {
      return { detachedFromParent, restoredPageIds: [] };
    }

    // Restore page and all its descendants
    await db
      .updateTable('pages')
      .set({
        deletedAt: null,
        deletedById: null,
        updatedAt: new Date(),
      })
      .where('id', 'in', idsToRestore)
      .execute();

    return { detachedFromParent, restoredPageIds: idsToRestore };
  }

  async getTrashPages(spaceId: string, pagination: PaginationOptions) {
    // Get root-level deleted pages (whose parent is not deleted or has no parent)
    const query = this.db
      .selectFrom('pages as p')
      .select([
        'p.id',
        'p.slugId',
        'p.title',
        'p.icon',
        'p.spaceId',
        'p.deletedAt',
        'p.deletedById',
      ])
      .select((eb) =>
        jsonObjectFrom(
          eb
            .selectFrom('spaces')
            .select(['spaces.id', 'spaces.name', 'spaces.slug'])
            .whereRef('spaces.id', '=', 'p.spaceId'),
        ).as('space'),
      )
      .select((eb) =>
        jsonObjectFrom(
          eb
            .selectFrom('users')
            .select(['users.id', 'users.name', 'users.avatarUrl'])
            .whereRef('users.id', '=', 'p.deletedById'),
        ).as('deletedBy'),
      )
      .leftJoin('pages as parent', 'p.parentPageId', 'parent.id')
      .where('p.spaceId', '=', spaceId)
      .where('p.deletedAt', 'is not', null)
      .where((eb) =>
        eb.or([
          eb('p.parentPageId', 'is', null),
          eb('parent.deletedAt', 'is', null),
        ]),
      )
      .orderBy('p.deletedAt', 'desc');

    return executeWithPagination(query, {
      page: pagination.page,
      perPage: pagination.limit,
    });
  }

  async permanentlyDeletePageAndDescendants(
    pageId: string,
    trx?: KyselyTransaction,
  ): Promise<string[]> {
    const db = dbOrTx(this.db, trx);

    // Get all page IDs that will be deleted
    const pagesToDelete = await db
      .withRecursive('page_tree', (qb) =>
        qb
          .selectFrom('pages')
          .select('id')
          .where('id', '=', pageId)
          .unionAll((eb) =>
            eb
              .selectFrom('pages as p')
              .select('p.id')
              .innerJoin('page_tree as pt', 'p.parentPageId', 'pt.id'),
          ),
      )
      .selectFrom('page_tree')
      .select('id')
      .execute();

    const pageIds = pagesToDelete.map((p) => p.id);

    if (pageIds.length === 0) {
      return [];
    }

    // Delete pages (cascade will handle shares, comments, etc.)
    await db.deleteFrom('pages').where('id', 'in', pageIds).execute();

    return pageIds;
  }
}
