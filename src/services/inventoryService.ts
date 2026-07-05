import { db } from '@/lib/db';
import { NotFoundError, AppError } from '@/lib/api-response';

export async function adjustInventoryStock(params: {
  inventoryId: string;
  change: number;
  reason: string;
}) {
  const inventory = await db.inventory.findUnique({ where: { id: params.inventoryId } });
  if (!inventory) throw new NotFoundError('Inventory record not found');

  const newStock = inventory.stock + params.change;
  if (newStock < 0) {
    throw new AppError(
      `Cannot reduce stock below zero. Current stock: ${inventory.stock}.`,
      409,
      'INSUFFICIENT_STOCK',
    );
  }

  const [updated] = await db.$transaction([
    db.inventory.update({
      where: { id: params.inventoryId },
      data: { stock: newStock },
    }),
    db.inventoryHistory.create({
      data: {
        inventoryId: params.inventoryId,
        change: params.change,
        reason: params.reason,
      },
    }),
  ]);

  return updated;
}

export async function setInventoryThreshold(inventoryId: string, lowStockThreshold: number) {
  const inventory = await db.inventory.findUnique({ where: { id: inventoryId } });
  if (!inventory) throw new NotFoundError('Inventory record not found');

  return db.inventory.update({
    where: { id: inventoryId },
    data: { lowStockThreshold },
  });
}
