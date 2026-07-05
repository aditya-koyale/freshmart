import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Card } from '@/components/ui/Card';
import { AddressForm } from '@/components/customer/AddressForm';
import { getAddress } from '@/services/addressService';
import { NotFoundError } from '@/lib/api-response';

export const metadata: Metadata = { title: 'Edit Address' };

export default async function EditAddressPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/login?redirect=/addresses/${params.id}/edit`);
  }

  let address;
  try {
    address = await getAddress(session.user.id, params.id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">Edit Address</h1>
      <div className="mt-6">
        <Card padding="lg">
          <AddressForm
            initialValues={{
              id: address.id,
              label: address.label,
              fullName: address.fullName,
              mobileNumber: address.mobileNumber,
              houseNumber: address.houseNumber,
              buildingName: address.buildingName,
              street: address.street,
              landmark: address.landmark,
              area: address.area,
              city: address.city,
              state: address.state,
              pinCode: address.pinCode,
              isDefault: address.isDefault,
            }}
          />
        </Card>
      </div>
    </div>
  );
}
