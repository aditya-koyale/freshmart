import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AddressCard } from '@/components/customer/AddressCard';
import { listAddresses } from '@/services/addressService';

export const metadata: Metadata = { title: 'My Addresses' };

export default async function AddressesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login?redirect=/addresses');
  }

  const addresses = await listAddresses(session.user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">My Addresses</h1>
        <Button href="/addresses/new" size="sm">
          Add New Address
        </Button>
      </div>

      <div className="mt-6">
        {addresses.length === 0 ? (
          <EmptyState
            title="No saved addresses yet"
            description="Add a delivery address to speed up checkout."
            action={<Button href="/addresses/new">Add Address</Button>}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {addresses.map((address) => (
              <AddressCard key={address.id} address={address} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
