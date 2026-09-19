import { and, asc, eq } from 'drizzle-orm';

import type { CategoryTreeItem, CreateCategoryInput } from '@hh/domain';

import { categories, type Category } from '../schema';

import type { DatabaseClient } from '../index';

export async function listCategoriesByStore(
  db: DatabaseClient,
  storeId: string
): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.storeId, storeId), eq(categories.isActive, true)))
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function findCategoryBySlug(
  db: DatabaseClient,
  storeId: string,
  slug: string
): Promise<Category | null> {
  const result = await db
    .select()
    .from(categories)
    .where(and(eq(categories.storeId, storeId), eq(categories.slug, slug)))
    .limit(1);

  return result[0] ?? null;
}

export async function createCategory(
  db: DatabaseClient,
  input: CreateCategoryInput
): Promise<Category> {
  const [created] = await db
    .insert(categories)
    .values({
      storeId: input.storeId,
      parentId: input.parentId,
      slug: input.slug,
      name: input.name,
      description: input.description,
      sortOrder: input.sortOrder,
      isActive: input.isActive
    })
    .returning();

  if (!created) {
    throw new Error('Failed to create category record');
  }

  return created;
}

export async function getCategoryTree(
  db: DatabaseClient,
  storeId: string
): Promise<CategoryTreeItem[]> {
  const allCategories = await listCategoriesByStore(db, storeId);

  const byParentId = new Map<string | null, Category[]>();
  for (const cat of allCategories) {
    const pId = cat.parentId ?? null;
    const existing = byParentId.get(pId) ?? [];
    existing.push(cat);
    byParentId.set(pId, existing);
  }

  function buildTree(parentId: string | null): CategoryTreeItem[] {
    const children = byParentId.get(parentId) ?? [];
    return children.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      subcategories: buildTree(c.id)
    }));
  }

  return buildTree(null);
}
