import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { BannerManager } from '@/components/admin/BannerManager';
export const metadata: Metadata = { title: 'Banners — FreshMart Admin' };
export default async function BannersPage() {
  const banners = await db.banner.findMany({ orderBy: { displayOrder: 'asc' } });
  return <BannerManager banners={banners.map((b) => ({
    id: b.id, imageUrl: b.imageUrl, title: b.title, subtitle: b.subtitle,
    buttonText: b.buttonText, destinationLink: b.destinationLink,
    displayOrder: b.displayOrder, isActive: b.isActive,
    startDate: b.startDate?.toISOString() ?? null, endDate: b.endDate?.toISOString() ?? null,
  }))} />;
}
