import { PrismaClient } from '@prisma/client';

/**
 * Prevents exhausting database connections from hot-reloading in
 * development, where every file change would otherwise instantiate a
 * fresh PrismaClient.
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}
