import { ok, handleApiError } from '@/lib/api-response';
import { requireCustomerSession } from '@/lib/session';
import { addressUpdateSchema } from '@/lib/validation/address';
import { updateAddress, deleteAddress } from '@/services/addressService';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireCustomerSession();
    const body = await request.json();
    const input = addressUpdateSchema.parse(body);

    const address = await updateAddress(session.user.id, params.id, input);
    return ok(address);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireCustomerSession();
    await deleteAddress(session.user.id, params.id);
    return ok({ message: 'Address deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
