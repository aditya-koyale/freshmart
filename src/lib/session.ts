import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppError } from '@/lib/api-response';

/**
 * Middleware already blocks non-admin requests from reaching /api/admin/*,
 * but route handlers still need the acting user's id for audit logging
 * (SRS Part 11 — admin action history). This re-checks defensively rather
 * than trusting middleware alone.
 */
export async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  return session;
}

export async function requireCustomerSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new AppError('You must be logged in', 401, 'UNAUTHORIZED');
  }

  return session;
}
