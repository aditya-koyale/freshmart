import type { Metadata } from 'next';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';

export const metadata: Metadata = {
  title: 'Admin — FreshMart',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold text-primary">FreshMart</h1>
          <p className="mt-1 text-sm text-ink-muted">Admin Dashboard</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold text-ink">Sign In</h2>
          <div className="mt-4">
            <AdminLoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
