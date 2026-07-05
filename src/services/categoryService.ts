import { db } from '@/lib/db';
import { ConflictError, NotFoundError } from '@/lib/api-response';
import type { CategoryInput, CategoryUpdateInput } from '@/lib/validation/category';

/**
 * Categories visible to customers: not hidden, not soft-deleted, ordered
 * for display (SRS Part 2 §2 — category browsing).
 */
export async function listPublicCategories() {
  return db.category.findMany({
    where: { isHidden: false, deletedAt: null },
    orderBy: { displayOrder: 'asc' },
  });
}

export async function listAdminCategories() {
  return db.category.findMany({
    where: { deletedAt: null },
    orderBy: { displayOrder: 'asc' },
  });
}

export async function getCategoryBySlug(slug: string) {
  const category = await db.category.findFirst({
    where: { slug, isHidden: false, deletedAt: null },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  return category;
}

export async function createCategory(input: CategoryInput) {
  const existing = await db.category.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw new ConflictError('A category with this slug already exists');
  }

  return db.category.create({ data: input });
}

export async function updateCategory(id: string, input: CategoryUpdateInput) {
  const category = await db.category.findUnique({ where: { id } });
  if (!category || category.deletedAt) {
    throw new NotFoundError('Category not found');
  }

  if (input.slug && input.slug !== category.slug) {
    const slugTaken = await db.category.findUnique({ where: { slug: input.slug } });
    if (slugTaken) {
      throw new ConflictError('A category with this slug already exists');
    }
  }

  return db.category.update({ where: { id }, data: input });
}

/**
 * Categories are soft-deleted (SRS Part 10 §1) so that historical orders
 * referencing products in this category remain intact.
 */
export async function deleteCategory(id: string) {
  const category = await db.category.findUnique({ where: { id } });
  if (!category || category.deletedAt) {
    throw new NotFoundError('Category not found');
  }

  const productCount = await db.product.count({
    where: { categoryId: id, deletedAt: null },
  });

  if (productCount > 0) {
    throw new ConflictError(
      'This category still has active products. Move or remove them before deleting the category.',
    );
  }

  return db.category.update({ where: { id }, data: { deletedAt: new Date() } });
}
