import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

/**
 * Records an admin action for the audit trail (SRS Part 11). Intentionally
 * fire-and-forget from the caller's perspective on failure — a logging
 * failure should never block the underlying business operation.
 */
export async function recordAuditLog(params: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log', error);
  }
}
