import { db } from '@/lib/db';
import { NotFoundError, ConflictError } from '@/lib/api-response';
import type { AddressInput, AddressUpdateInput } from '@/lib/validation/address';

export async function listAddresses(userId: string) {
  return db.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getAddress(userId: string, id: string) {
  const address = await db.address.findFirst({ where: { id, userId } });
  if (!address) {
    throw new NotFoundError('Address not found');
  }
  return address;
}

/**
 * A user's first saved address always becomes the default, even if they
 * didn't check the box — there should never be a state where a customer
 * has addresses but none of them is usable as "the" delivery address.
 */
export async function createAddress(userId: string, input: AddressInput) {
  const existingCount = await db.address.count({ where: { userId } });
  const shouldBeDefault = input.isDefault || existingCount === 0;

  return db.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: { ...input, userId, isDefault: shouldBeDefault },
    });
  });
}

export async function updateAddress(
  userId: string,
  id: string,
  input: AddressUpdateInput,
) {
  const address = await db.address.findFirst({ where: { id, userId } });
  if (!address) {
    throw new NotFoundError('Address not found');
  }

  return db.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return tx.address.update({ where: { id }, data: input });
  });
}

/**
 * Addresses referenced by past orders are never deleted (would corrupt
 * order history) — blocked with a clear message instead. If the deleted
 * address was the default, the most recently created remaining address
 * is promoted automatically so the user is never left without a default.
 */
export async function deleteAddress(userId: string, id: string) {
  const address = await db.address.findFirst({ where: { id, userId } });
  if (!address) {
    throw new NotFoundError('Address not found');
  }

  const orderCount = await db.order.count({ where: { addressId: id } });
  if (orderCount > 0) {
    throw new ConflictError(
      'This address is linked to past orders and can\u2019t be deleted. You can edit it instead.',
    );
  }

  await db.address.delete({ where: { id } });

  if (address.isDefault) {
    const next = await db.address.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (next) {
      await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }
}

export async function setDefaultAddress(userId: string, id: string) {
  const address = await db.address.findFirst({ where: { id, userId } });
  if (!address) {
    throw new NotFoundError('Address not found');
  }

  await db.$transaction([
    db.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } }),
    db.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
}
