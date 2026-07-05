import { AdminSidebar } from '@/components/admin/AdminSidebar';

/**
 * Route group (panel) wraps all authenticated admin pages with the
 * sidebar shell. /admin/login lives outside this group and gets only
 * the root layout (no sidebar), which is exactly the desired behaviour.
 */
export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-subtle">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
