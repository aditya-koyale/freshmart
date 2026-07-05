import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/PageHeader';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { db } from '@/lib/db';
export const metadata: Metadata = { title: 'Settings — FreshMart Admin' };
export default async function SettingsPage() {
  const rows = await db.setting.findMany();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" description="Business configuration and operational defaults." />
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
