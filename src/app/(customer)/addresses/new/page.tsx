import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Card } from '@/components/ui/Card';
import { AddressForm } from '@/components/customer/AddressForm';

export const metadata: Metadata = { title: 'Add Address' };

export default async function NewAddressPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login?redirect=/addresses/new');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">Add New Address</h1>
      <div className="mt-6">
        <Card padding="lg">
          <AddressForm />
        </Card>
      </div>
    </div>
  );
}
