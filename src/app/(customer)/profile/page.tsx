import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Card } from '@/components/ui/Card';
import { ProfileForm } from '@/components/customer/ProfileForm';
import { ChangePasswordForm } from '@/components/customer/ChangePasswordForm';
import { LogoutButton } from '@/components/customer/LogoutButton';
import { getProfile } from '@/services/authService';

export const metadata: Metadata = { title: 'My Account' };

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?redirect=/profile');
  }

  const profile = await getProfile(session.user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">My Account</h1>
        <LogoutButton />
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <Card padding="lg">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">My Addresses</h2>
            <Link href="/addresses" className="text-sm font-medium text-primary hover:underline">
              Manage
            </Link>
          </div>
          <p className="mt-2 text-sm text-ink-muted">
            Add or edit your saved delivery addresses.
          </p>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">My Wishlist</h2>
            <Link href="/wishlist" className="text-sm font-medium text-primary hover:underline">
              View
            </Link>
          </div>
          <p className="mt-2 text-sm text-ink-muted">
            Products you&apos;ve saved for later.
          </p>
        </Card>

        <Card padding="lg">
          <h2 className="font-display text-lg font-semibold text-ink">Personal Details</h2>
          <div className="mt-4">
            <ProfileForm
              initialProfile={{
                fullName: profile.fullName,
                email: profile.email,
                mobileNumber: profile.mobileNumber,
              }}
            />
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="font-display text-lg font-semibold text-ink">Change Password</h2>
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
