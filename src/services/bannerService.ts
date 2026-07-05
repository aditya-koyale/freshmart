import { db } from '@/lib/db';

export interface PublicBanner {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  destinationLink: string | null;
  displayOrder: number;
}

/**
 * Returns active banners for the customer homepage, filtered by date
 * window when configured. Ordered by displayOrder ascending so the admin
 * controls the sequence without re-uploading.
 */
export async function listPublicBanners(): Promise<PublicBanner[]> {
  const now = new Date();
  return db.banner.findMany({
    where: {
      isActive: true,
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ],
    },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      imageUrl: true,
      title: true,
      subtitle: true,
      buttonText: true,
      destinationLink: true,
      displayOrder: true,
    },
  });
}
