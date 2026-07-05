import { z } from 'zod';
import { ok, handleApiError } from '@/lib/api-response';
import { requireAdminSession } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);

    const query = z.object({
      page: z.coerce.number().int().min(1).default(1),
      search: z.string().trim().optional(),
    }).parse({
      page: searchParams.get('page') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    });

    const PAGE_SIZE = 25;
    const where = query.search
      ? {
          role: 'CUSTOMER' as const,
          OR: [
            { fullName: { contains: query.search, mode: 'insensitive' as const } },
            { email: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : { role: 'CUSTOMER' as const };

    const [customers, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true, fullName: true, email: true, mobileNumber: true,
          isActive: true, createdAt: true, lastLoginAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.user.count({ where }),
    ]);

    return ok({
      customers,
      pagination: { page: query.page, total, totalPages: Math.ceil(total / PAGE_SIZE) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
